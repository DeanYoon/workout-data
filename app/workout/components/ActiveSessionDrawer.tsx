"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddExerciseModal } from "./AddExerciseModal";
import { RestTimerModal } from "./RestTimerModal";
import { WorkoutSummaryModal } from "./WorkoutSummaryModal";
import { ExerciseCard, ExerciseItem, ExerciseSet } from "./ExerciseCard";
import { supabase } from "@/lib/supabase";

interface ActiveSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActiveSessionDrawer({ isOpen, onClose }: ActiveSessionDrawerProps) {
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
          osc.frequency.value = 880; // A5
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

  // Workout Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
      setExercises([]);
      stopRestTimer();
      setIsSummaryOpen(false);
      setIsSaving(false);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

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
    // Optional: adjust total if adding time extends beyond original
    // But usually we just track current remaining.
    // If adding negative, we don't change totalRestSeconds usually to keep progress bar making sense?
    // Actually progress bar uses totalRestSeconds.
    // Let's update totalRestSeconds if we add time, but maybe not if subtract?
    // For simplicity, let's keep total as max reference or update it.
    // If we add 10s, total should probably increase to reflect new scale.
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

  // Save Workout Logic
  const handleSaveWorkout = async () => {
    try {
      setIsSaving(true);
      
      // Get current user (optional, if auth is implemented, otherwise might need to skip or use placeholder)
      // Since supabase client is initialized, we can try to get session.
      // If no session, we might fail RLS or need to allow anon.
      // Assuming for this task we just insert.
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user"; // Fallback for dev without auth

      // 1. Create Workout
      const workoutId = crypto.randomUUID();
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - elapsedTime * 1000).toISOString();

      const { error: workoutError } = await supabase.from('workouts').insert({
        id: workoutId,
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
        total_weight: totalVolume,
        total_sets: totalSets
      });

      if (workoutError) throw workoutError;

      // 2. Create Exercises & Sets
      // We'll do this sequentially or in parallel batches.
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        
        // Insert Exercise
        const { error: exError } = await supabase.from('exercises').insert({
          id: ex.id,
          workout_id: workoutId,
          name: ex.name,
          order: i
        });
        
        if (exError) throw exError;

        // Insert Sets
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

      // Success
      onClose(); // Close drawer
      router.push("/"); // Navigate home
      
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout. Please try again.");
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
          <div className="flex flex-col items-center w-20">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Rest</span>
             <span className="font-mono text-sm font-medium">
                {isResting ? formatTime(restSecondsRemaining) : "00:00"}
             </span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Duration</span>
            <span className="font-mono text-2xl font-bold tracking-tight">{formatTime(elapsedTime)}</span>
          </div>

          <button
            onClick={() => setIsSummaryOpen(true)}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 w-20"
          >
            Finish
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-4 pb-24 dark:bg-black">
          {exercises.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
              <DumbbellIcon className="mb-4 h-12 w-12 opacity-20" />
              <p>No exercises added yet.</p>
              <p className="text-sm">Tap the button below to start.</p>
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
        onSave={handleSaveWorkout}
        onCancel={() => setIsSummaryOpen(false)}
      />
    </>
  );
}

function DumbbellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </svg>
  );
}
