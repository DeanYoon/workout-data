"use client";

import { useEffect, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { WorkoutHistoryCard } from "./components/WorkoutHistoryCard";
import { ActiveSessionDrawer } from "./components/ActiveSessionDrawer";
import { WorkoutDetailDrawer } from "./components/WorkoutDetailDrawer";
import { supabase } from "@/lib/supabase";
import { WorkoutWithDetails } from "@/types/workout";
import { ExerciseItem, ExerciseSet } from "./components/ExerciseCard";

export default function WorkoutPage() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [historyWorkouts, setHistoryWorkouts] = useState<WorkoutWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);

  // Active session state props
  const [activeSessionInitialData, setActiveSessionInitialData] = useState<ExerciseItem[] | undefined>(undefined);
  const [activeSessionInitialName, setActiveSessionInitialName] = useState<string | undefined>(undefined);

  // Fetch Workouts
  const fetchWorkouts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (
            *,
            sets (*)
          )
        `)
        .order("start_time", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = data.map((w: any) => ({
          ...w,
          exercises: w.exercises
            .sort((a: any, b: any) => a.order - b.order)
            .map((e: any) => ({
              ...e,
              sets: e.sets.sort((a: any, b: any) => a.order - b.order)
            }))
        }));

        const uniqueWorkoutsMap = new Map<string, WorkoutWithDetails>();

        formattedData.forEach((workout: WorkoutWithDetails) => {
          const nameKey = workout.name ? workout.name.trim() : "Untitled";
          if (!uniqueWorkoutsMap.has(nameKey)) {
            uniqueWorkoutsMap.set(nameKey, workout);
          }
        });

        setHistoryWorkouts(Array.from(uniqueWorkoutsMap.values()));
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleDelete = (id: string) => {
    setHistoryWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const handleStartRoutine = (workout: WorkoutWithDetails) => {
    const initialData: ExerciseItem[] = workout.exercises.map((ex) => ({
      id: crypto.randomUUID(),
      name: ex.name,
      sets: ex.sets.map((set) => ({
        id: crypto.randomUUID(),
        weight: set.weight,
        reps: set.reps,
        isCompleted: false,
      })),
    }));

    setActiveSessionInitialData(initialData);
    setActiveSessionInitialName(workout.name); // Set name from history
    setSelectedWorkout(null);
    setIsWorkoutActive(true);
  };

  // Duration formatting helper
  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "Unknown";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    return `${minutes}m`;
  };

  // Date formatting helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
      {/* Sticky Start Button Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Workout</h1>
        <button
          onClick={() => {
            setActiveSessionInitialData(undefined);
            setActiveSessionInitialName(undefined); // Let drawer handle default date name
            setIsWorkoutActive(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="h-5 w-5 fill-current" />
          Start Empty Workout
        </button>
      </div>

      {/* History Grid */}
      <div className="p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wider">Recent History</h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm h-32 animate-pulse dark:bg-zinc-900">
                <div className="h-4 w-12 bg-zinc-200 rounded dark:bg-zinc-800"></div>
                <div className="h-6 w-24 bg-zinc-200 rounded dark:bg-zinc-800"></div>
                <div className="mt-auto flex flex-col gap-2">
                  <div className="h-3 w-16 bg-zinc-200 rounded dark:bg-zinc-800"></div>
                  <div className="h-3 w-16 bg-zinc-200 rounded dark:bg-zinc-800"></div>
                </div>
              </div>
            ))}
          </div>
        ) : historyWorkouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <p>No workout history yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {historyWorkouts.map((workout) => (
              <WorkoutHistoryCard
                key={workout.id}
                id={workout.id}
                date={formatDate(workout.start_time)}
                duration={formatDuration(workout.start_time, workout.end_time)}
                totalWeight={workout.total_weight}
                workoutName={workout.name}
                onDelete={handleDelete}
                onClick={() => setSelectedWorkout(workout)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active Session Drawer */}
      <ActiveSessionDrawer
        isOpen={isWorkoutActive}
        onClose={() => setIsWorkoutActive(false)}
        initialData={activeSessionInitialData}
        initialWorkoutName={activeSessionInitialName}
      />

      {/* Workout Detail Drawer */}
      <WorkoutDetailDrawer
        isOpen={!!selectedWorkout}
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onStartRoutine={handleStartRoutine}
      />
    </div>
  );
}
