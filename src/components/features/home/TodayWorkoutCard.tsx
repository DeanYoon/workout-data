"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Clock, Dumbbell, CheckCircle2 } from "lucide-react";
import { formatDuration, getDayLabel } from "@/utils";
import { useSettingsStore } from "@/stores";
import type { WorkoutSummary } from "@/services";
import type { WorkoutWithDetails } from "@/types/workout";

interface TodayWorkoutCardProps {
    splitOrder: string[];
    weekWorkouts: Array<{ start_time: string; name: string | null }>;
    todayWorkout: WorkoutSummary | null;
    todayWorkoutDetail: WorkoutWithDetails | null;
    onStartWorkout?: (workoutName: string) => void;
}

export function TodayWorkoutCard({ splitOrder, weekWorkouts, todayWorkout: initialTodayWorkout, todayWorkoutDetail, onStartWorkout }: TodayWorkoutCardProps) {
    const { t } = useTranslation();
    const language = useSettingsStore((s) => s.language);
    const [nextWorkoutName, setNextWorkoutName] = useState<string | null>(null);

    const getTodayDayIndex = () => {
        const now = new Date();
        const day = now.getDay();
        return day === 0 ? 6 : day - 1;
    };

    const dayLabel = getDayLabel(new Date(), language);

    // 가장 최근 운동 기준 그다음 운동 계산 → nextWorkoutName, 로그
    useEffect(() => {
        const mostRecent = initialTodayWorkout?.name
            ? initialTodayWorkout.name
            : (() => {
                const sorted = [...weekWorkouts].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
                return sorted[0]?.name ?? null;
            })();
        const nextIdx = splitOrder.length > 0 ? (splitOrder.indexOf(mostRecent ?? "") + 1) % splitOrder.length : -1;
        const nextWorkout = nextIdx >= 0 ? splitOrder[nextIdx] : null;

        if (initialTodayWorkout != null) {
            setNextWorkoutName(null);
        } else {
            setNextWorkoutName(nextWorkout);
        }
        console.log("[TodayWorkoutCard] 가장 최근 운동:", mostRecent, "| 분할 운동 리스트:", splitOrder, "| 그다음 운동:", nextWorkout);
    }, [initialTodayWorkout, weekWorkouts, splitOrder]);

    const handleStartWorkout = () => {
        if (!nextWorkoutName) return;
        onStartWorkout?.(nextWorkoutName);
    };

    // 오늘 이미 운동 완료 → 디테일 기록 카드
    if (initialTodayWorkout != null) {
        const r = initialTodayWorkout;
        return (
            <div className="mb-4 rounded-2xl bg-zinc-800 p-6 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600 text-white text-sm font-bold">
                        {dayLabel}
                    </div>
                    <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('home.today.completed')}
                    </span>
                </div>
                <p className="text-xl font-bold text-white dark:text-zinc-100 mb-2">
                    <span className="text-blue-400">{r.name || t('home.today.workout')}</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 dark:text-zinc-400 mb-4">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDuration(r.start_time, r.end_time)}</span>
                    <span className="flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5" />{r.total_weight.toLocaleString()}kg · {r.total_sets} {t('workout.sets')}</span>
                </div>

                {todayWorkoutDetail?.exercises && todayWorkoutDetail.exercises.length > 0 ? (
                    <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1 -mr-1">
                        {todayWorkoutDetail.exercises.map((ex, exIdx) => {
                            const sets = (ex.sets || []).filter((s) => s.is_completed);
                            return (
                                <div key={ex.id || exIdx} className="rounded-xl border border-zinc-700/60 bg-zinc-800/50 dark:bg-zinc-900/50 p-3">
                                    <div className="text-sm font-semibold text-zinc-100 mb-2">
                                        {exIdx + 1}. {ex.name}
                                    </div>
                                    {sets.length > 0 ? (
                                        <div className="space-y-1">
                                            {sets.map((set, setIdx) => (
                                                <div key={set.id || setIdx} className="flex justify-between text-sm text-zinc-400">
                                                    <span>{t('workout.set')} {setIdx + 1}</span>
                                                    <span className="font-medium text-zinc-200">{set.weight}kg × {set.reps} {t('workout.reps')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-500">{t('home.today.noSets')}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : todayWorkoutDetail && (!todayWorkoutDetail.exercises || todayWorkoutDetail.exercises.length === 0) ? (
                    <p className="text-sm text-zinc-500 py-2">{t('home.today.noRecords')}</p>
                ) : (
                    <p className="text-sm text-zinc-500 py-2">{t('home.today.loadDetailError')}</p>
                )}
            </div>
        );
    }

    // 오늘 미완료 → 다음 할 운동 + 시작 버튼
    if (!nextWorkoutName) return null;

    return (
        <div className="mb-4 rounded-2xl bg-zinc-800 p-6 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold">
                    {dayLabel}
                </div>
            </div>
            <div className="mb-6">
                <p className="text-xl font-bold text-white dark:text-zinc-100 mb-1">
                    {t('home.today.todayIs')} <span className="text-blue-400">{nextWorkoutName}</span>
                </p>
                <p className="text-xl font-bold text-white dark:text-zinc-100">
                    {t('home.today.runDay')} 🔥
                </p>
            </div>
            <button
                onClick={handleStartWorkout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
                <span>{t('home.today.startRoutine', { name: nextWorkoutName })}</span>
                <Play className="h-5 w-5 fill-current" />
            </button>
        </div>
    );
}



