"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AddExerciseModal } from "./AddExerciseModal";
import { RestTimerModal } from "./RestTimerModal";
import { WorkoutSummaryModal } from "./WorkoutSummaryModal";
import { DeleteConfirmModal } from "@/components";
import { ExerciseCard, ExerciseItem, ExerciseSet } from "./ExerciseCard";
import { formatTime } from "@/utils";
import { useUserStore, useSettingsStore } from "@/stores";
import { saveWorkout, getRecentWorkoutsWithExercises } from "@/services";

export interface ActiveSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ExerciseItem[];
  initialWorkoutName?: string;
}

export function ActiveSessionDrawer({ isOpen, onClose, initialData, initialWorkoutName }: ActiveSessionDrawerProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("Workout");
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isResting, setIsResting] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(60);
  const [totalRestSeconds, setTotalRestSeconds] = useState(60);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerStartTimeRef = useRef<number | null>(null);
  const restTimerInitialSecondsRef = useRef<number>(60);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOpen && !isSummaryOpen) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      if (initialWorkoutName) {
        setWorkoutName(initialWorkoutName);
      } else if (elapsedTime === 0) {
        const d = new Date();
        const dateStr = format(d, language === 'ko' ? 'yyyy.M.d' : 'M/d/yyyy', { locale: language === 'ko' ? ko : enUS });
        setWorkoutName(t('workout.workoutOn', { date: dateStr }));
      }

      if (initialData && exercises.length === 0) {
        setExercises(initialData);
      }

    } else if (!isOpen) {
      setElapsedTime(0);
      setExercises([]);
      stopRestTimer();
      setIsSummaryOpen(false);
      setIsSaving(false);
      setWorkoutName(t('workout.defaultName'));
      setIsEditingName(false);
    }

    return () => clearInterval(interval);
  }, [isOpen, isSummaryOpen, initialData, initialWorkoutName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (!isResting) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && restTimerStartTimeRef.current !== null) {
        const now = Date.now();
        const elapsed = Math.floor((now - restTimerStartTimeRef.current) / 1000);
        const initialSeconds = restTimerInitialSecondsRef.current;
        const newRemaining = Math.max(0, initialSeconds - elapsed);

        if (newRemaining <= 0) {
          stopRestTimer();
          playBeep();
        } else {
          setRestSecondsRemaining(newRemaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isResting]);

  const startRestTimer = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    const initialSeconds = 60;
    setIsResting(true);
    setRestSecondsRemaining(initialSeconds);
    setTotalRestSeconds(initialSeconds);
    restTimerStartTimeRef.current = Date.now();
    restTimerInitialSecondsRef.current = initialSeconds;

    restTimerRef.current = setInterval(() => {
      if (restTimerStartTimeRef.current === null) return;

      const now = Date.now();
      const elapsed = Math.floor((now - restTimerStartTimeRef.current) / 1000);
      const newRemaining = Math.max(0, restTimerInitialSecondsRef.current - elapsed);

      if (newRemaining <= 0) {
        stopRestTimer();
        playBeep();
      } else {
        setRestSecondsRemaining(newRemaining);
      }
    }, 100);
  };

  const stopRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    restTimerStartTimeRef.current = null;
    setIsResting(false);
  };

  const addRestTime = (seconds: number) => {
    if (restTimerStartTimeRef.current === null) return;

    const now = Date.now();
    const elapsed = Math.floor((now - restTimerStartTimeRef.current) / 1000);
    const currentRemaining = Math.max(0, restTimerInitialSecondsRef.current - elapsed);
    const newRemaining = Math.max(0, currentRemaining + seconds);

    restTimerInitialSecondsRef.current = newRemaining;
    restTimerStartTimeRef.current = now;

    setRestSecondsRemaining(newRemaining);
    if (seconds > 0) {
      setTotalRestSeconds((prev) => prev + seconds);
    }
  };

  const handleAddExercise = (name: string) => {
    (async () => {
      let templateSets: ExerciseSet[] = [
        {
          id: crypto.randomUUID(),
          weight: 0,
          reps: 0,
          isCompleted: false,
        },
      ];

      try {
        const userId = await useUserStore.getState().getUserId();
        const workoutsData = await getRecentWorkoutsWithExercises(userId);

        if (workoutsData && workoutsData.length > 0) {
          const matchingWorkout = workoutsData.find((workout: any) =>
            workout.exercises?.some(
              (ex: any) => ex.name === name && ex.sets && ex.sets.length > 0
            )
          );

          if (matchingWorkout) {
            const exercise = matchingWorkout.exercises.find(
              (ex: any) => ex.name === name && ex.sets && ex.sets.length > 0
            );

            if (exercise) {
              const sortedSets = [...exercise.sets].sort(
                (a: any, b: any) => a.order - b.order
              );

              templateSets = sortedSets.map((set: any) => ({
                id: crypto.randomUUID(),
                weight: set.weight ?? 0,
                reps: set.reps ?? 0,
                isCompleted: false,
              }));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load previous exercise sets:", error);
      }

      const newExercise: ExerciseItem = {
        id: crypto.randomUUID(),
        name,
        sets: templateSets,
      };

      setExercises((prev) => [...prev, newExercise]);
      setIsAddModalOpen(false);
    })();
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
    onClose();
  };

  const handleCancelCancel = () => {
    setIsCancelModalOpen(false);
  };

  const handleSaveWorkout = async (name: string) => {
    const finalName = name || workoutName;

    try {
      setIsSaving(true);

      const userId = await useUserStore.getState().getUserId();
      const workoutId = crypto.randomUUID();
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - elapsedTime * 1000).toISOString();

      await saveWorkout({
        id: workoutId,
        userId,
        name: finalName,
        startTime,
        endTime,
        totalWeight: totalVolume,
        totalSets,
        exercises: exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets.map((set) => ({
            id: set.id,
            weight: set.weight,
            reps: set.reps,
            isCompleted: set.isCompleted,
          })),
        })),
      });

      onClose();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workoutSaved'));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(t('workout.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-black animate-in slide-in-from-bottom duration-300">
        <header className="flex h-16 items-center justify-between border-b px-4 dark:border-zinc-800">
          <button
            onClick={handleCancelWorkout}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center flex-1 mx-4">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value.slice(0, 8))}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                }}
                maxLength={8}
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
            disabled={totalSets === 0}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:dark:hover:bg-zinc-100"
          >
            {t('workout.finish')}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-zinc-50 p-4 pb-4 dark:bg-black">
          {isResting && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-blue-50 p-3 px-4 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
              <span className="text-sm font-medium">{t('workout.resting')}</span>
              <span className="font-mono text-lg font-bold">{formatTime(restSecondsRemaining)}</span>
            </div>
          )}

          {exercises.length === 0 ? (
            <div className="flex  flex-col items-center justify-center text-zinc-500 ">
              <p>{t('workout.tapAddExercise')}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={exercises.map((ex) => ex.id)}
                strategy={verticalListSortingStrategy}
              >
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
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3.5 font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
            >
              <Plus className="h-5 w-5" />
              {t('workout.addExercise')}
            </button>
          </div>
        </div>
      </div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExercise}
        addedExerciseNames={exercises.map((e) => e.name)}
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
        isNameEditable={!initialWorkoutName}
        onSave={handleSaveWorkout}
        onCancel={handleCancelSummary}
      />

      <DeleteConfirmModal
        isOpen={isCancelModalOpen}
        title={t('workout.cancelWorkout')}
        message={t('workout.cancelProgressLost')}
        confirmText={t('workout.cancelWorkout')}
        cancelText={t('workout.continue')}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelCancel}
      />
    </>
  );
}



