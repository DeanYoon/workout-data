"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Check, X } from "lucide-react";

interface DaySchedule {
  date: Date;
  dayLabel: string;
  isToday: boolean;
  hasWorkout: boolean;
  workoutName: string | null;
  workoutNameShort: string | null;
  isPast: boolean;
  isFuture: boolean;
}

export function WeeklySchedule() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [splitOrder, setSplitOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get start and end of current week (Monday to Sunday)
  const getWeekDays = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getDayLabel = (date: Date) => {
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    return dayNames[date.getDay()];
  };

  const getWorkoutNameShort = (name: string | null): string | null => {
    if (!name) return null;
    return name.length >= 2 ? name.substring(0, 2) : name;
  };

  const fetchSplitOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const { data, error } = await supabase
        .from("split_config")
        .select("split_order")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching split config:", error);
        return;
      }

      if (data && data.split_order) {
        setSplitOrder(data.split_order as string[]);
      }
    } catch (error) {
      console.error("Error fetching split order:", error);
    }
  };

  const fetchWeekWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const weekDays = getWeekDays();
      const start = weekDays[0].toISOString();
      const end = new Date(weekDays[6]);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("workouts")
        .select("start_time, name")
        .eq("user_id", userId)
        .eq("is_disabled", false)
        .gte("start_time", start)
        .lte("start_time", end.toISOString());

      if (error) {
        console.error("Error fetching workouts:", error);
        return;
      }

      // Create a map of date to workout name
      const workoutMap = new Map<string, string>();
      if (data) {
        data.forEach((workout) => {
          const date = new Date(workout.start_time);
          const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          if (workout.name) {
            workoutMap.set(dateKey, workout.name);
          }
        });
      }

      // Build schedule
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate workout sequence based on completed workouts
      const calculateWorkoutForDay = (date: Date, dayIndex: number): string | null => {
        if (splitOrder.length === 0) return null;

        // Find all completed workouts before this date (from Monday of this week)
        const completedWorkouts: string[] = [];
        for (let i = 0; i < dayIndex; i++) {
          const checkDate = weekDays[i];
          const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
          if (workoutMap.has(dateKey)) {
            const workoutName = workoutMap.get(dateKey);
            if (workoutName) {
              completedWorkouts.push(workoutName);
            }
          }
        }

        // Find the last completed workout's index in split order
        let lastWorkoutIndex = -1;
        if (completedWorkouts.length > 0) {
          const lastWorkoutName = completedWorkouts[completedWorkouts.length - 1];
          lastWorkoutIndex = splitOrder.indexOf(lastWorkoutName);
        }

        // Calculate next workout index (rotate)
        const nextIndex = (lastWorkoutIndex + 1) % splitOrder.length;
        return splitOrder[nextIndex];
      };

      const scheduleData: DaySchedule[] = weekDays.map((date, index) => {
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const hasWorkout = workoutMap.has(dateKey);
        const workoutName = hasWorkout ? workoutMap.get(dateKey) || null : null;
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today;
        const isFuture = date > today;

        let displayWorkoutName: string | null = null;
        let displayWorkoutNameShort: string | null = null;

        if (hasWorkout) {
          // 운동한 날: 실제 운동 이름 표시
          displayWorkoutName = workoutName;
          displayWorkoutNameShort = getWorkoutNameShort(workoutName);
        } else if (isToday || isFuture) {
          // 오늘과 미래: 완료한 운동을 기준으로 다음 운동 계산
          const nextWorkout = calculateWorkoutForDay(date, index);
          if (nextWorkout) {
            displayWorkoutName = nextWorkout;
            displayWorkoutNameShort = getWorkoutNameShort(nextWorkout);
          }
        }
        // 과거이고 운동 안한 날: 표시 안함 (X만 표시)

        return {
          date,
          dayLabel: getDayLabel(date),
          isToday,
          hasWorkout,
          workoutName: displayWorkoutName,
          workoutNameShort: displayWorkoutNameShort,
          isPast,
          isFuture,
        };
      });

      setSchedule(scheduleData);
    } catch (error) {
      console.error("Error fetching week workouts:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchSplitOrder();
      await fetchWeekWorkouts();
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return null;
  }

  if (schedule.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
      <div className="grid grid-cols-7 gap-2">
        {schedule.map((day, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl ${
              day.isToday
                ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : ""
            }`}
          >
            {/* Day Label */}
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {day.dayLabel}
            </span>

            {/* Icon */}
            {day.hasWorkout ? (
              // 운동한 날: 체크 표시
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500">
                <Check className="h-4 w-4 text-white" />
              </div>
            ) : day.isPast ? (
              // 과거이고 운동 안한 날: X 표시
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500">
                <X className="h-4 w-4 text-white" />
              </div>
            ) : (
              // 오늘/미래이고 운동 안한 날: 점선 원 표시
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-zinc-400 dark:border-zinc-600" />
            )}

            {/* Workout Name */}
            {day.workoutNameShort && (
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {day.workoutNameShort}
              </span>
            )}

            {/* Today Label */}
            {day.isToday && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Today
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
