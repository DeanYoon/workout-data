"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/app/stores/useUserStore";
import { WorkoutWithDetails } from "@/types/workout";
import { WeeklyScheduleProps, DaySchedule } from "./types";
import { getWeekDays, getDayLabel, getWorkoutNameShort, getWorkoutForDate } from "./utils";
import { WeeklyView } from "./WeeklyView";
import { MonthlyCalendarView } from "./MonthlyCalendarView";
import { WorkoutDetailModal } from "@/app/components/WorkoutDetail/WorkoutDetailModal";

export function WeeklySchedule({ splitOrder, weekWorkouts, allWorkouts }: WeeklyScheduleProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Create workout map for all workouts
  const allWorkoutsMap = new Map<string, string>();
  allWorkouts.forEach((workout) => {
    const date = new Date(workout.start_time);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (workout.name) {
      allWorkoutsMap.set(dateKey, workout.name);
    }
  });

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the modal
      if (modalRef.current && modalRef.current.contains(event.target as Node)) {
        return;
      }

      if (isExpanded && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Fetch workout for selected date
  const fetchWorkoutForDate = async (date: Date) => {
    setIsLoadingWorkout(true);
    setSelectedDate(date);

    try {
      const userId = await useUserStore.getState().getUserId();

      // Get start and end of the selected date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (
            *,
            sets (*)
          )
        `)
        .eq("user_id", userId)
        .eq("is_disabled", false)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const workout = data[0] as any;
        const formattedWorkout: WorkoutWithDetails = {
          ...workout,
          exercises: workout.exercises
            .sort((a: any, b: any) => a.order - b.order)
            .map((e: any) => ({
              ...e,
              sets: e.sets.sort((a: any, b: any) => a.order - b.order)
            }))
        };
        setSelectedWorkout(formattedWorkout);
      } else {
        setSelectedWorkout(null);
      }
    } catch (error) {
      console.error("Error fetching workout:", error);
      setSelectedWorkout(null);
    } finally {
      setIsLoadingWorkout(false);
    }
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const workoutInfo = getWorkoutForDate(date, allWorkoutsMap, splitOrder, allWorkouts);
    if (workoutInfo.hasWorkout) {
      fetchWorkoutForDate(date);
    }
  };

  useEffect(() => {
    const weekDays = getWeekDays();

    // Create a map of date to workout name
    const workoutMap = new Map<string, string>();
    weekWorkouts.forEach((workout) => {
      const date = new Date(workout.start_time);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (workout.name) {
        workoutMap.set(dateKey, workout.name);
      }
    });

    // Build schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the starting workout index for this week
    const getStartingWorkoutIndex = (): number => {
      if (splitOrder.length === 0) return 0;

      const weekStart = weekDays[0];
      let lastWorkoutIndex = -1;
      let lastWorkoutDate: Date | null = null;

      allWorkouts.forEach((workout) => {
        const workoutDate = new Date(workout.start_time);
        if (workoutDate < weekStart && workout.name) {
          const index = splitOrder.indexOf(workout.name);
          if (index !== -1 && (!lastWorkoutDate || workoutDate > lastWorkoutDate)) {
            lastWorkoutIndex = index;
            lastWorkoutDate = workoutDate;
          }
        }
      });

      return lastWorkoutIndex === -1 ? 0 : (lastWorkoutIndex + 1) % splitOrder.length;
    };

    const startingIndex = getStartingWorkoutIndex();

    const calculateWorkoutForDay = (dayIndex: number): string | null => {
      if (splitOrder.length === 0) return null;
      const workoutIndex = (startingIndex + dayIndex) % splitOrder.length;
      return splitOrder[workoutIndex];
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
        displayWorkoutName = workoutName;
        displayWorkoutNameShort = getWorkoutNameShort(workoutName);
      } else if (isToday || isFuture) {
        const scheduledWorkout = calculateWorkoutForDay(index);
        if (scheduledWorkout) {
          displayWorkoutName = scheduledWorkout;
          displayWorkoutNameShort = getWorkoutNameShort(scheduledWorkout);
        }
      }

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
  }, [splitOrder, weekWorkouts, allWorkouts]);

  if (schedule.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-40" />
      )}

      <div
        ref={calendarRef}
        className={`mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 transition-all duration-300 ${
          isExpanded
            ? "fixed inset-x-4 top-20 bottom-20 z-50 overflow-y-auto p-4"
            : "p-4"
        }`}
      >
        {!isExpanded ? (
          <WeeklyView schedule={schedule} onExpand={() => setIsExpanded(true)} />
        ) : (
          <MonthlyCalendarView
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDateClick={handleDateClick}
            allWorkoutsMap={allWorkoutsMap}
            splitOrder={splitOrder}
            allWorkouts={allWorkouts}
          />
        )}
      </div>

      {/* Workout Detail Modal */}
      {selectedDate && (
        <WorkoutDetailModal
          selectedDate={selectedDate}
          selectedWorkout={selectedWorkout}
          isLoadingWorkout={isLoadingWorkout}
          onClose={() => {
            setSelectedDate(null);
            setSelectedWorkout(null);
          }}
        />
      )}
    </>
  );
}
