"use client";

import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
  isCompleted: boolean;
}

interface ExerciseItem {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

interface PreviousSet {
  weight: number;
  reps: number;
}

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  totalTime: string;
  totalVolume: number;
  totalSets: number;
  isSaving: boolean;
  initialName?: string;
  isNameEditable?: boolean;
  exercises?: ExerciseItem[];
  previousWorkoutData?: Map<string, PreviousSet[]>;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function WorkoutSummaryModal({
  isOpen,
  totalTime,
  totalVolume,
  totalSets,
  isSaving,
  initialName = "",
  isNameEditable = true,
  exercises = [],
  previousWorkoutData,
  onSave,
  onCancel,
}: WorkoutSummaryModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSaveClick = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const isImproved = (currentValue: number, previousValue: number | undefined) => {
    return previousValue !== undefined && currentValue > previousValue;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!isSaving ? onCancel : undefined}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {t('workout.summaryComplete')}
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                {isNameEditable ? t('workout.summaryConfirmName') : t('workout.summaryWillSave')}
              </p>

              {/* Name Input */}
              <div className="w-full mb-6">
                <label htmlFor="workoutName" className="sr-only">Workout Name</label>
                {isNameEditable ? (
                  <input
                    id="workoutName"
                    type="text"
                    placeholder={t('workout.summaryNamePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    autoFocus
                  />
                ) : (
                  <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center font-medium dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 text-zinc-600 dark:text-zinc-400">
                    {name || t('workout.untitled')}
                  </div>
                )}
              </div>

              <div className="mb-6 grid w-full grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('workout.time')}</span>
                  <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalTime}</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('workout.volume')}</span>
                  <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalVolume}kg</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('workout.sets')}</span>
                  <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalSets}</span>
                </div>
              </div>

              {/* Exercise Details */}
              {exercises.length > 0 && (
                <div className="mb-6 max-h-[320px] overflow-y-auto space-y-3">
                  {exercises.map((exercise, exerciseIndex) => {
                    const completedSets = exercise.sets.filter(s => s.isCompleted);
                    if (completedSets.length === 0) return null;

                    const previousSets = previousWorkoutData?.get(exercise.name) || [];

                    return (
                      <div key={exercise.id} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
                        <div className="mb-3 font-bold text-base text-zinc-900 dark:text-zinc-100">
                          {exerciseIndex + 1}. {exercise.name}
                        </div>
                        <div className="space-y-2.5">
                          {completedSets.map((set, setIndex) => {
                            const prevSet = previousSets[setIndex];
                            const weightImproved = isImproved(set.weight, prevSet?.weight);
                            const repsImproved = isImproved(set.reps, prevSet?.reps);

                            return (
                              <div key={set.id} className="flex items-center justify-between text-sm py-1">
                                <span className="text-zinc-600 dark:text-zinc-400 font-medium min-w-[60px]">
                                  {t('workout.set')} {setIndex + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold min-w-[60px] justify-end">
                                    {set.weight}kg
                                    {weightImproved && (
                                      <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </span>
                                  <span className="text-zinc-500 font-bold">×</span>
                                  <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold min-w-[50px]">
                                    {set.reps}
                                    {repsImproved && (
                                      <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={handleSaveClick}
                  disabled={isSaving || !name.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('workout.saving')}
                    </>
                  ) : (
                    t('workout.saveFinish')
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isSaving}
                  className="w-full rounded-xl py-3.5 font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-300"
                >
                  {t('workout.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}



