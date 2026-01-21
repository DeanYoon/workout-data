"use client";

import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { format, formatDateLong } from "@/utils";
import { useSettingsStore } from "@/stores";
import { WorkoutWithDetails } from "@/types/workout";

interface WorkoutDetailViewProps {
    workout: WorkoutWithDetails;
    showDate?: boolean;
    showStatus?: boolean;
    variant?: "modal" | "drawer";
}

export function WorkoutDetailView({
    workout,
    showDate = false,
    showStatus = false,
    variant = "modal",
}: WorkoutDetailViewProps) {
    const { t } = useTranslation();
    const language = useSettingsStore((s) => s.language);
    const isDrawer = variant === "drawer";

    return (
        <div className="space-y-3">
            {/* Workout Header */}
            {showStatus ? (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 border-2 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500">
                            <Check className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {t('workout.completed')}
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {workout.name || t('workout.untitled')}
                            </div>
                        </div>
                    </div>
                    {workout.start_time && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {format(new Date(workout.start_time), "HH:mm")} {t('workout.startSuffix')}
                            {workout.end_time && ` - ${format(new Date(workout.end_time), "HH:mm")} ${t('workout.endSuffix')}`}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h2 className={`${isDrawer ? "text-xl" : "text-lg"} font-bold text-zinc-900 dark:text-zinc-100`}>
                        {workout.name || t('workout.untitled')}
                    </h2>
                    {showDate && workout.start_time && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {formatDateLong(new Date(workout.start_time), language)}
                        </p>
                    )}
                </div>
            )}

            {/* Exercises */}
            {workout.exercises && workout.exercises.length > 0 ? (
                <div className="space-y-2">
                    {!isDrawer && (
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('workout.exerciseList')}</h4>
                    )}
                    {workout.exercises.map((exercise, exerciseIndex) => (
                        <div
                            key={exercise.id || exerciseIndex}
                            className={`${isDrawer
                                    ? "rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
                                    : "rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3"
                                }`}
                        >
                            <div className={`${isDrawer ? "mb-3" : "mb-2"} font-semibold text-zinc-900 dark:text-zinc-100`}>
                                {isDrawer ? `${exerciseIndex + 1}. ${exercise.name}` : exercise.name}
                            </div>
                            {exercise.sets && exercise.sets.length > 0 ? (
                                isDrawer ? (
                                    <>
                                        {/* Table Header for Drawer */}
                                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wide text-center mb-2">
                                            <div className="col-span-2">{t('workout.set')}</div>
                                            <div className="col-span-5">kg</div>
                                            <div className="col-span-5">{t('workout.reps')}</div>
                                        </div>
                                        <div className="space-y-1">
                                            {exercise.sets.map((set, setIndex) => (
                                                <div key={set.id || setIndex} className="grid grid-cols-12 gap-2 text-sm text-center py-1">
                                                    <div className="col-span-2 text-zinc-500">{setIndex + 1}</div>
                                                    <div className="col-span-5 font-medium">{set.weight}</div>
                                                    <div className="col-span-5 font-medium">{set.reps}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1">
                                        {exercise.sets.map((set, setIndex) => (
                                            <div
                                                key={set.id || setIndex}
                                                className="flex items-center justify-between text-base"
                                            >
                                                <span className="text-zinc-600 dark:text-zinc-400">
                                                    {t('workout.set')} {setIndex + 1}
                                                </span>
                                                <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                                                    {set.weight}kg × {set.reps} {t('workout.reps')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {t('workout.noSetRecords')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`${isDrawer ? "p-4" : "p-3"} rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center text-sm text-zinc-600 dark:text-zinc-400`}>
                    {t('home.today.noRecords')}
                </div>
            )}
        </div>
    );
}



