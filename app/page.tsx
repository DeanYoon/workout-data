"use client";

import { useState, useEffect } from "react";
import { Settings, Play, CheckCircle2, X, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Workout, WorkoutWithDetails } from "@/types/workout";
import {
  calculateRoutineSchedule,
  getWeekDates,
  isToday,
  isBeforeToday,
  isAfterToday,
  DayInfo,
  WeekStats,
} from "@/utils/routineHelper";
import { SplitSettingsModal } from "./components/SplitSettingsModal";
import { ActiveSessionDrawer } from "./workout/components/ActiveSessionDrawer";
import { ExerciseItem } from "./workout/components/ExerciseCard";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function Home() {
  const [weekDates, setWeekDates] = useState<Date[]>(getWeekDates());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [splitNames, setSplitNames] = useState<string[]>(["상체", "하체"]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routineDays, setRoutineDays] = useState<DayInfo[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStats>({ done: 0, missed: 0, total: 0 });
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [activeSessionInitialData, setActiveSessionInitialData] = useState<ExerciseItem[] | undefined>(undefined);
  const [activeSessionInitialName, setActiveSessionInitialName] = useState<string | undefined>(undefined);

  // Fetch user settings
  const fetchUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const { data, error } = await supabase
        .from("user_settings")
        .select("split_names")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching user settings:", error);
      }

      if (data?.split_names) {
        setSplitNames(data.split_names);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  };

  // Fetch workouts
  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("is_disabled", false)
        .order("start_time", { ascending: false });

      if (error) throw error;

      if (data) {
        setWorkouts(data);
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  // Fetch selected date workout details
  const fetchWorkoutDetails = async (date: Date) => {
    if (!selectedDate) return;

    try {
      const dateStr = date.toISOString().split("T")[0];
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
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
        .eq("is_disabled", false)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const formattedData: WorkoutWithDetails = {
          ...data,
          exercises: (data.exercises || [])
            .sort((a: any, b: any) => a.order - b.order)
            .map((e: any) => ({
              ...e,
              sets: (e.sets || []).sort((a: any, b: any) => a.order - b.order),
            })),
        };
        setSelectedWorkout(formattedData);
      } else {
        setSelectedWorkout(null);
      }
    } catch (error) {
      console.error("Error fetching workout details:", error);
      setSelectedWorkout(null);
    }
  };

  // Calculate routine schedule
  useEffect(() => {
    const { days, stats } = calculateRoutineSchedule(weekDates, workouts, splitNames);
    setRoutineDays(days);
    setWeekStats(stats);
  }, [weekDates, workouts, splitNames]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserSettings(), fetchWorkouts()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Fetch workout details when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchWorkoutDetails(selectedDate);
    } else {
      setSelectedWorkout(null);
    }
  }, [selectedDate]);

  // Set initial selected date to today
  useEffect(() => {
    if (!selectedDate && routineDays.length > 0) {
      const todayIndex = routineDays.findIndex((day) => isToday(day.date));
      if (todayIndex >= 0) {
        setSelectedDate(routineDays[todayIndex].date);
      } else {
        setSelectedDate(routineDays[0].date);
      }
    }
  }, [routineDays, selectedDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleStartWorkout = () => {
    if (!selectedDate) return;

    const dayInfo = routineDays.find((d) => isToday(d.date));
    const workoutName = dayInfo?.label || "운동";

    setActiveSessionInitialData(undefined);
    setActiveSessionInitialName(workoutName);
    setIsWorkoutActive(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "Unknown";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return `${minutes}분`;
  };

  const selectedDayInfo = selectedDate
    ? routineDays.find((d) => {
        const dDate = new Date(d.date);
        const sDate = new Date(selectedDate);
        return (
          dDate.getFullYear() === sDate.getFullYear() &&
          dDate.getMonth() === sDate.getMonth() &&
          dDate.getDate() === sDate.getDate()
        );
      })
    : null;

  const progressPercentage = weekStats.total > 0 ? (weekStats.done / weekStats.total) * 100 : 0;

  return (
    <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight">SmartLift</h1>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(new Date())}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Goal Dashboard */}
        <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              이번 주 목표 달성: {weekStats.done}/{weekStats.total}회
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {routineDays.map((day, index) => {
              const dayDate = new Date(day.date);
              const isSelected =
                selectedDate &&
                dayDate.getFullYear() === selectedDate.getFullYear() &&
                dayDate.getMonth() === selectedDate.getMonth() &&
                dayDate.getDate() === selectedDate.getDate();
              const isTodayDate = isToday(dayDate);
              const isPast = isBeforeToday(dayDate);
              const isFuture = isAfterToday(dayDate);

              let circleColor = "";
              let borderStyle = "";

              if (day.status === "DONE") {
                circleColor = "bg-green-500";
              } else if (day.status === "MISSED") {
                if (day.label === "휴식") {
                  circleColor = "bg-zinc-400";
                } else {
                  circleColor = "bg-red-500";
                }
              } else {
                // PLANNED
                borderStyle = "border-2 border-dashed border-zinc-300 dark:border-zinc-700";
                circleColor = "bg-transparent";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(dayDate)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${circleColor} ${borderStyle} ${
                      isTodayDate && !isSelected ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    {day.status === "DONE" && <CheckCircle2 className="h-5 w-5 text-white" />}
                    {day.status === "MISSED" && day.label !== "휴식" && (
                      <X className="h-5 w-5 text-white" />
                    )}
                    {isTodayDate && day.status === "PLANNED" && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {DAY_LABELS[index]}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{day.label}</span>
                  {isTodayDate && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">Today</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Content */}
        {selectedDayInfo && selectedDate && (
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            {(() => {
              const isPast = isBeforeToday(selectedDate);
              const isTodayDate = isToday(selectedDate);
              const isFuture = isAfterToday(selectedDate);

              // Past with workout
              if (isPast && selectedWorkout) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {DAY_LABELS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}
                      </span>
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedWorkout.name}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(selectedDate)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">시간</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {formatDuration(selectedWorkout.start_time, selectedWorkout.end_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">볼륨</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {selectedWorkout.total_weight}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">세트</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {selectedWorkout.total_sets}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Today without workout
              if (isTodayDate && !selectedWorkout) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        오늘
                      </span>
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        오늘은 [{selectedDayInfo.label}] 하는 날이에요! 🔥
                      </h3>
                    </div>
                    <button
                      onClick={handleStartWorkout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      {selectedDayInfo.label} 루틴 시작하기 ▶
                    </button>
                  </div>
                );
              }

              // Past without workout
              if (isPast && !selectedWorkout) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {DAY_LABELS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        이날은 운동을 쉬셨네요.
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(selectedDate)}
                      </p>
                    </div>
                  </div>
                );
              }

              // Future
              if (isFuture) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(selectedDate)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        이날은 [{selectedDayInfo.label}]가 예정되어 있어요.
                      </h3>
                    </div>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SplitSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newSplitNames) => {
          setSplitNames(newSplitNames);
          setIsSettingsOpen(false);
        }}
        currentSplitNames={splitNames}
      />

      {/* Active Session Drawer */}
      <ActiveSessionDrawer
        isOpen={isWorkoutActive}
        onClose={() => {
          setIsWorkoutActive(false);
          fetchWorkouts(); // Refresh workouts after closing
        }}
        initialData={activeSessionInitialData}
        initialWorkoutName={activeSessionInitialName}
      />
    </div>
  );
}
