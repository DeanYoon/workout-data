"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { WeeklyGoalModal } from "./WeeklyGoalModal";

interface WeeklyGoalProgressProps {
    weeklyGoal: number | null;
    weekWorkouts: Array<{ start_time: string; name: string | null }>;
    onDataChange?: () => void;
}

export function WeeklyGoalProgress({ weeklyGoal: initialWeeklyGoal, weekWorkouts, onDataChange }: WeeklyGoalProgressProps) {
    const [weeklyGoal, setWeeklyGoal] = useState<number | null>(initialWeeklyGoal);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Count unique workout days from weekWorkouts
    const currentWeekWorkouts = new Set(
        weekWorkouts.map((workout) => {
            const date = new Date(workout.start_time);
            return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        })
    ).size;

    const saveWeeklyGoal = async (goal: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";

            const { data, error } = await supabase
                .from("weekly_goals")
                .upsert({
                    user_id: userId,
                    weekly_target: goal,
                }, {
                    onConflict: 'user_id'
                })
                .select();

            if (error) {
                console.error("Error saving weekly goal:", error);
                alert("목표 저장에 실패했습니다: " + error.message);
                throw error;
            }

            // Update state immediately
            setWeeklyGoal(goal);

            // Notify parent to refresh data
            if (onDataChange) {
                onDataChange();
            }

            // Trigger cache invalidation event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('homeDataChanged'));
            }
        } catch (error) {
            console.error("Error saving weekly goal:", error);
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
                        주간 목표를 설정하세요
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
                        이번 주 목표 달성: {currentWeekWorkouts} / {weeklyGoal}회
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
        </>
    );
}
