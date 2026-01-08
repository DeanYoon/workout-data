"use client";

import { Play, X } from "lucide-react";
import { WorkoutWithDetails } from "@/types/workout";

interface WorkoutDetailDrawerProps {
  workout: WorkoutWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStartRoutine: (workout: WorkoutWithDetails) => void;
}

export function WorkoutDetailDrawer({
  workout,
  isOpen,
  onClose,
  onStartRoutine,
}: WorkoutDetailDrawerProps) {
  if (!isOpen || !workout) return null;

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85vh] flex-col rounded-t-3xl bg-white dark:bg-zinc-900 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {workout.name || "Untitled Workout"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatDate(workout.start_time)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {workout.exercises.map((exercise, index) => (
              <div key={exercise.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  {index + 1}. {exercise.name}
                </h3>
                
                {/* Sets Table */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wide text-center mb-2">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-5">kg</div>
                  <div className="col-span-5">Reps</div>
                </div>

                <div className="space-y-1">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="grid grid-cols-12 gap-2 text-sm text-center py-1">
                      <div className="col-span-2 text-zinc-500">{setIndex + 1}</div>
                      <div className="col-span-5 font-medium">{set.weight}</div>
                      <div className="col-span-5 font-medium">{set.reps}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action */}
        <div className="border-t bg-white p-4 pb-safe dark:bg-zinc-900 dark:border-zinc-800">
          <button
            onClick={() => onStartRoutine(workout)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            Start with this Routine
          </button>
        </div>
      </div>
    </>
  );
}
