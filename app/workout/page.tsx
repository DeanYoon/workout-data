"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { WorkoutHistoryCard } from "./components/WorkoutHistoryCard";
import { ActiveSessionDrawer } from "./components/ActiveSessionDrawer";
import { WorkoutDetailDrawer } from "./components/WorkoutDetailDrawer";
import { supabase } from "@/lib/supabase";
import { WorkoutWithDetails } from "@/types/workout";
import { ExerciseItem } from "./components/ExerciseCard";
import { useWorkoutHistoryStore } from "@/app/stores/useWorkoutHistoryStore";
import { useEffect } from "react";

export default function WorkoutPage() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const { historyWorkouts, isLoading, refreshWorkoutHistory, fetchWorkoutHistory } = useWorkoutHistoryStore();

  useEffect(() => {
    fetchWorkoutHistory();
  }, [fetchWorkoutHistory]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);

  // Active session state props
  const [activeSessionInitialData, setActiveSessionInitialData] = useState<ExerciseItem[] | undefined>(undefined);
  const [activeSessionInitialName, setActiveSessionInitialName] = useState<string | undefined>(undefined);

  const handleDelete = async (id: string) => {
    try {
      // Update database
      const { error } = await supabase
        .from("workouts")
        .update({ is_disabled: true })
        .eq("id", id);

      if (error) throw error;

      // Trigger refresh event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workoutDeleted'));
      }

      // Refresh data
      await refreshWorkoutHistory();
    } catch (error) {
      console.error("Error deleting workout:", error);
      alert("Failed to delete workout");
    }
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
