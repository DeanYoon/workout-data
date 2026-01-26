"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WeeklyGoalModal } from "./WeeklyGoalModal";
import { LoginRequiredModal } from "@/components";
import { useUserStore } from "@/stores";
import { saveWeeklyGoal as saveWeeklyGoalService } from "@/services";

interface WeeklyGoalProgressProps {
    weeklyGoal: number | null;
    weekWorkouts: Array<{ start_time: string; name: string | null }>;
    onDataChange?: () => void;
}

export function WeeklyGoalProgress({ weeklyGoal: initialWeeklyGoal, weekWorkouts, onDataChange }: WeeklyGoalProgressProps) {
    const { t } = useTranslation();
    const [weeklyGoal, setWeeklyGoal] = useState<number | null>(initialWeeklyGoal);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const currentWeekWorkouts = new Set(
        weekWorkouts.map((workout) => {
            const date = new Date(workout.start_time);
            return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        })
    ).size;

    const saveWeeklyGoal = async (goal: number) => {
        try {
            const userId = await useUserStore.getState().getUserId();
            if (userId === 'anon_user') {
                setIsModalOpen(false);
                setIsLoginModalOpen(true);
                return;
            }

            await saveWeeklyGoalService(userId, goal);

            setWeeklyGoal(goal);

            if (onDataChange) {
                onDataChange();
            }

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('homeDataChanged'));
            }
        } catch (error) {
            console.error("Error saving weekly goal:", error);
            alert(t('home.weeklyGoal.saveError'));
            throw error;
        }
    };

    // Don't show if no goal is set
    if (weeklyGoal === null) {
        return (
            <>
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="mb-4 cursor-pointer rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900"
                >
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('home.weeklyGoal.setPrompt')}
                    </p>
                </div>
                <WeeklyGoalModal
                    isOpen={isModalOpen}
                    currentGoal={null}
                    onSave={saveWeeklyGoal}
                    onClose={() => setIsModalOpen(false)}
                />
            </>
        );
    }

    const percentage = Math.round((currentWeekWorkouts / weeklyGoal) * 100);

    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="mb-4 cursor-pointer rounded-2xl bg-zinc-800 p-4 dark:bg-zinc-900 transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-800"
            >
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white dark:text-zinc-100">
                        {t('home.weeklyGoal.progress', { current: currentWeekWorkouts, goal: weeklyGoal })}
                    </p>
                    <p className="text-sm font-bold text-green-500 dark:text-green-400">
                        {percentage}%
                    </p>
                </div>
                <div className="w-full h-2 bg-zinc-700 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 dark:bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>
            <WeeklyGoalModal
                isOpen={isModalOpen}
                currentGoal={weeklyGoal}
                onSave={saveWeeklyGoal}
                onClose={() => setIsModalOpen(false)}
            />
            <LoginRequiredModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    );
}



