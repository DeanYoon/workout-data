"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { WorkoutWithDetails } from "@/types/workout";
import { useWorkoutHistoryStore } from "@/stores";
import { formatDate, formatDuration } from "@/utils";
import { deleteWorkout } from "@/services";
import {
  WorkoutHistoryCard,
  ActiveSessionDrawer,
  WorkoutDetailDrawer,
  type ExerciseItem,
} from "@/components";

export default function WorkoutPage() {
  const { t } = useTranslation();
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const { historyWorkouts, isLoading, isLoaded, refreshWorkoutHistory, fetchWorkoutHistory } = useWorkoutHistoryStore();

  useEffect(() => {
    // Only fetch if not already loaded
    if (!isLoaded) {
      fetchWorkoutHistory();
    }
  }, [isLoaded, fetchWorkoutHistory]);

  // Listen for workout saved event to refresh history
  useEffect(() => {
    const handleWorkoutSaved = () => {
      refreshWorkoutHistory();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('workoutSaved', handleWorkoutSaved);
      return () => {
        window.removeEventListener('workoutSaved', handleWorkoutSaved);
      };
    }
  }, [refreshWorkoutHistory]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithDetails | null>(null);

  // Active session state props
  const [activeSessionInitialData, setActiveSessionInitialData] = useState<ExerciseItem[] | undefined>(undefined);
  const [activeSessionInitialName, setActiveSessionInitialName] = useState<string | undefined>(undefined);

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkout(id);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workoutDeleted'));
      }

      await refreshWorkoutHistory();
    } catch (error) {
      console.error("Error deleting workout:", error);
      alert(t('workout.deleteWorkoutFailed'));
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

  return (
    <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
      {/* Sticky Start Button Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80 z-50">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('workout.title')}</h1>
        <button
          onClick={() => {
            setActiveSessionInitialData(undefined);
            setActiveSessionInitialName(undefined); // Let drawer handle default date name
            setIsWorkoutActive(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="h-5 w-5 fill-current" />
          {t('workout.startEmpty')}
        </button>
      </div>

      {/* History Grid */}
      <div className="p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wider">{t('workout.recentRoutines')}</h2>

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
            <p>{t('workout.noHistory')}</p>
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



