"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WeeklyGoalModal } from "./WeeklyGoalModal";

export function WeeklyGoalProgress() {
    const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null);
    const [currentWeekWorkouts, setCurrentWeekWorkouts] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get start and end of current week (Monday to Sunday)
    const getWeekRange = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { start: monday.toISOString(), end: sunday.toISOString() };
    };

    const fetchWeeklyGoal = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";

            const { data, error } = await supabase
                .from("weekly_goals")
                .select("weekly_target")
                .eq("user_id", userId)
                .single();

            if (error && error.code !== "PGRST116") {
                // PGRST116 is "no rows returned", which is fine
                console.error("Error fetching weekly goal:", error);
                return;
            }

            if (data) {
                setWeeklyGoal(data.weekly_target);
            }
        } catch (error) {
            console.error("Error fetching weekly goal:", error);
        }
    };

    const fetchCurrentWeekWorkouts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";

            const { start, end } = getWeekRange();

            const { data, error } = await supabase
                .from("workouts")
                .select("start_time")
                .eq("user_id", userId)
                .eq("is_disabled", false)
                .gte("start_time", start)
                .lte("start_time", end);

            if (error) {
                console.error("Error fetching workouts:", error);
                return;
            }

            if (data) {
                // Count unique workout days
                const uniqueDays = new Set(
                    data.map((workout) => {
                        const date = new Date(workout.start_time);
                        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    })
                );
                setCurrentWeekWorkouts(uniqueDays.size);
            }
        } catch (error) {
            console.error("Error fetching current week workouts:", error);
        }
    };

    const saveWeeklyGoal = async (goal: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";

            console.log("Saving weekly goal:", { userId, goal });

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

            console.log("Weekly goal saved successfully:", data);

            // Update state immediately
            setWeeklyGoal(goal);

            // Refresh workout count after saving
            await fetchCurrentWeekWorkouts();
        } catch (error) {
            console.error("Error saving weekly goal:", error);
            throw error;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchWeeklyGoal(), fetchCurrentWeekWorkouts()]);
            setIsLoading(false);
        };
        loadData();
    }, []);

    if (isLoading) {
        return null;
    }

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
