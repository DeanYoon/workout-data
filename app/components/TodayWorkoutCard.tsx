"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Play } from "lucide-react";

interface TodayWorkoutCardProps {
    onStartWorkout?: (workoutName: string) => void;
}

export function TodayWorkoutCard({ onStartWorkout }: TodayWorkoutCardProps) {
    const [todayWorkout, setTodayWorkout] = useState<string | null>(null);
    const [splitOrder, setSplitOrder] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Get today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const getTodayDayIndex = () => {
        const now = new Date();
        const day = now.getDay();
        // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
        return day === 0 ? 6 : day - 1;
    };

    const fetchSplitOrder = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";

            const { data, error } = await supabase
                .from("split_config")
                .select("split_order")
                .eq("user_id", userId)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching split config:", error);
                return;
            }

            if (data && data.split_order) {
                setSplitOrder(data.split_order as string[]);
            }
        } catch (error) {
            console.error("Error fetching split order:", error);
        }
    };

    // Get start of current week (Monday)
    const getWeekStart = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const fetchTodayWorkout = async () => {
        try {
            const { data: { user } = {} } = await supabase.auth.getUser();
            const userId = user?.id || "anon_user";

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Check if workout was done today
            const { data: workoutData, error: workoutError } = await supabase
                .from("workouts")
                .select("name")
                .eq("user_id", userId)
                .eq("is_disabled", false)
                .gte("start_time", today.toISOString())
                .lt("start_time", tomorrow.toISOString())
                .limit(1);

            if (workoutError) {
                console.error("Error fetching today's workout:", workoutError);
                return;
            }

            // If workout was done today, use that name
            if (workoutData && workoutData.length > 0 && workoutData[0].name) {
                setTodayWorkout(workoutData[0].name);
                return;
            }

            // Calculate next workout based on completed workouts this week
            if (splitOrder.length === 0) {
                return;
            }

            const weekStart = getWeekStart();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(23, 59, 59, 999);

            // Get all workouts from Monday to yesterday
            const { data: weekWorkouts, error: weekError } = await supabase
                .from("workouts")
                .select("start_time, name")
                .eq("user_id", userId)
                .eq("is_disabled", false)
                .gte("start_time", weekStart.toISOString())
                .lte("start_time", yesterday.toISOString())
                .order("start_time", { ascending: true });

            if (weekError) {
                console.error("Error fetching week workouts:", weekError);
                return;
            }

            // Find the last completed workout's index in split order
            let lastWorkoutIndex = -1;
            if (weekWorkouts && weekWorkouts.length > 0) {
                // Get unique workout days and find the last one
                const workoutDays = new Map<string, string>();
                weekWorkouts.forEach((workout) => {
                    const date = new Date(workout.start_time);
                    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    if (workout.name) {
                        workoutDays.set(dateKey, workout.name);
                    }
                });

                // Find the last workout name
                const sortedDays = Array.from(workoutDays.entries()).sort();
                if (sortedDays.length > 0) {
                    const lastWorkoutName = sortedDays[sortedDays.length - 1][1];
                    lastWorkoutIndex = splitOrder.indexOf(lastWorkoutName);
                }
            }

            // Calculate next workout index (rotate)
            const nextIndex = (lastWorkoutIndex + 1) % splitOrder.length;
            const workoutName = splitOrder[nextIndex];
            setTodayWorkout(workoutName);
        } catch (error) {
            console.error("Error fetching today's workout:", error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchSplitOrder();
            await fetchTodayWorkout();
            setIsLoading(false);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (splitOrder.length > 0) {
            fetchTodayWorkout();
        }
    }, [splitOrder]);

    const handleStartWorkout = () => {
        if (!todayWorkout) return;

        if (onStartWorkout) {
            onStartWorkout(todayWorkout);
        }
    };

    if (isLoading || !todayWorkout) {
        return null;
    }

    const getDayLabel = () => {
        const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
        const todayIndex = getTodayDayIndex();
        return dayNames[todayIndex];
    };

    return (
        <div className="mb-4 rounded-2xl bg-zinc-800 p-6 dark:bg-zinc-900">
            {/* Day Label */}
            <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold">
                    {getDayLabel()}
                </div>
            </div>

            {/* Main Text */}
            <div className="mb-6">
                <p className="text-xl font-bold text-white dark:text-zinc-100 mb-1">
                    오늘은 <span className="text-blue-400">{todayWorkout}</span>
                </p>
                <p className="text-xl font-bold text-white dark:text-zinc-100">
                    달리는 날입니다! 🔥
                </p>
            </div>

            {/* Start Button */}
            <button
                onClick={handleStartWorkout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
                <span>{todayWorkout} 루틴 시작하기</span>
                <Play className="h-5 w-5 fill-current" />
            </button>
        </div>
    );
}
