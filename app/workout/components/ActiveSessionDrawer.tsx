"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddExerciseModal } from "./AddExerciseModal";
import { RestTimerModal } from "./RestTimerModal";
import { WorkoutSummaryModal } from "./WorkoutSummaryModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ExerciseCard, ExerciseItem, ExerciseSet } from "./ExerciseCard";
import { supabase } from "@/lib/supabase";

interface ActiveSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExerciseItem[];
  initialWorkoutName?: string; // New prop for passing name
}

export function ActiveSessionDrawer({ isOpen, onClose, initialData, initialWorkoutName }: ActiveSessionDrawerProps) {
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("Workout");
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(60);
  const [totalRestSeconds, setTotalRestSeconds] = useState(60);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound Effect
  const playBeep = () => {
    if (typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {
        console.error("Audio playback failed", e);
      }

      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  // Initialization & Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOpen && !isSummaryOpen) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Initialize Name
      if (initialWorkoutName) {
        setWorkoutName(initialWorkoutName);
      } else if (elapsedTime === 0) { // Only set default if new session
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
        setWorkoutName(`Workout on ${date}`);
      }

      // Initialize Data
      if (initialData && exercises.length === 0) {
        setExercises(initialData);
      }

    } else if (!isOpen) {
      // Reset
      setElapsedTime(0);
      setExercises([]);
      stopRestTimer();
      setIsSummaryOpen(false);
      setIsSaving(false);
      setWorkoutName("Workout");
      setIsEditingName(false);
    }

    return () => clearInterval(interval);
  }, [isOpen, isSummaryOpen, initialData, initialWorkoutName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // Rest Timer Logic
  const startRestTimer = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setIsResting(true);
    setRestSecondsRemaining(60);
    setTotalRestSeconds(60);

    restTimerRef.current = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          stopRestTimer();
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setIsResting(false);
  };

  const addRestTime = (seconds: number) => {
    setRestSecondsRemaining((prev) => {
      const newVal = prev + seconds;
      return newVal < 0 ? 0 : newVal;
    });
    if (seconds > 0) {
      setTotalRestSeconds((prev) => prev + seconds);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddExercise = (name: string) => {
    const newExercise: ExerciseItem = {
      id: crypto.randomUUID(),
      name,
      sets: [
        {
          id: crypto.randomUUID(),
          weight: 0,
          reps: 0,
          isCompleted: false,
        },
      ],
    };
    setExercises((prev) => [...prev, newExercise]);
    setIsAddModalOpen(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: ExerciseSet = {
            id: crypto.randomUUID(),
            weight: lastSet ? lastSet.weight : 0,
            reps: lastSet ? lastSet.reps : 0,
            isCompleted: false,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    );
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
        }
        return ex;
      })
    );
  };

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps" | "isCompleted",
    value: number | boolean
  ) => {
    if (field === "isCompleted" && value === true) {
      startRestTimer();
    }

    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                return { ...s, [field]: value };
              }
              return s;
            }),
          };
        }
        return ex;
      })
    );
  };

  // Stats Calculation
  const calculateStats = () => {
    let volume = 0;
    let sets = 0;
    exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.isCompleted) {
          volume += set.weight * set.reps;
          sets += 1;
        }
      });
    });
    return { volume, sets };
  };

  const { volume: totalVolume, sets: totalSets } = calculateStats();

  // Actions
  const handleFinishClick = () => {
    stopRestTimer();
    setIsSummaryOpen(true);
  };

  const handleCancelSummary = () => {
    setIsSummaryOpen(false);
  };

  const handleCancelWorkout = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    stopRestTimer();
    setIsCancelModalOpen(false);
    onClose(); // This resets state via useEffect
  };

  const handleCancelCancel = () => {
    setIsCancelModalOpen(false);
  };

  const handleSaveWorkout = async (name: string) => {
    // If user changes name in summary modal, use that. Otherwise fallback to current workoutName.
    // The summary modal calls this with its internal name state, which defaults to props or empty.
    // We should probably init summary modal with workoutName.
    const finalName = name || workoutName;

    try {
      setIsSaving(true);
      console.log("Starting save process...");

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const workoutId = crypto.randomUUID();
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - elapsedTime * 1000).toISOString();

      const workoutData = {
        id: workoutId,
        user_id: userId,
        name: finalName,
        start_time: startTime,
        end_time: endTime,
        total_weight: totalVolume,
        total_sets: totalSets
      };

      const { error: workoutError } = await supabase.from('workouts').insert(workoutData);
      if (workoutError) throw workoutError;

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const exerciseData = {
          id: ex.id,
          workout_id: workoutId,
          name: ex.name,
          order: i
        };
        const { error: exError } = await supabase.from('exercises').insert(exerciseData);
        if (exError) throw exError;

        const setsToInsert = ex.sets.map((set, setIndex) => ({
          id: set.id,
          exercise_id: ex.id,
          weight: set.weight,
          reps: set.reps,
          is_completed: set.isCompleted,
          order: setIndex
        }));

        if (setsToInsert.length > 0) {
          const { error: setsError } = await supabase.from('sets').insert(setsToInsert);
          if (setsError) throw setsError;
        }
      }

      console.log("Save completed successfully");
      onClose();
      window.location.reload();

    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save workout.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 dark:border-zinc-800">
          <button
            onClick={handleCancelWorkout}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center flex-1 mx-4">
            {/* Editable Title */}
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                }}
                className="w-full max-w-[200px] bg-transparent text-center text-sm font-semibold outline-none border-b border-blue-500 pb-0.5"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 text-sm font-semibold hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded"
              >
                <span className="truncate max-w-[180px]">{workoutName}</span>
                <Edit2 className="h-3 w-3 opacity-50" />
              </button>
            )}
            <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
              {formatTime(elapsedTime)}
            </span>
          </div>

          <button
            onClick={handleFinishClick}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Finish
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-4 pb-24 dark:bg-black">
          {/* Rest Timer Banner if active */}
          {isResting && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-blue-50 p-3 px-4 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
              <span className="text-sm font-medium">Resting...</span>
              <span className="font-mono text-lg font-bold">{formatTime(restSecondsRemaining)}</span>
            </div>
          )}

          {exercises.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500 mt-20">
              <p>Tap below to add an exercise</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  exerciseIndex={index}
                  onRemove={handleRemoveExercise}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onUpdateSet={handleUpdateSet}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4 pb-safe dark:bg-black dark:border-zinc-800">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3.5 font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
          >
            <Plus className="h-5 w-5" />
            Add Exercise
          </button>
        </div>
      </div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExercise}
      />

      <RestTimerModal
        isOpen={isResting}
        secondsRemaining={restSecondsRemaining}
        totalSeconds={totalRestSeconds}
        onAddSeconds={addRestTime}
        onSkip={stopRestTimer}
      />

      <WorkoutSummaryModal
        isOpen={isSummaryOpen}
        totalTime={formatTime(elapsedTime)}
        totalVolume={totalVolume}
        totalSets={totalSets}
        isSaving={isSaving}
        initialName={workoutName}
        onSave={handleSaveWorkout}
        onCancel={handleCancelSummary}
      />

      <DeleteConfirmModal
        isOpen={isCancelModalOpen}
        title="Cancel Workout?"
        message="Current progress will be lost."
        confirmText="Cancel Workout"
        cancelText="Continue"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelCancel}
      />
    </>
  );
}
