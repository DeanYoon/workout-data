"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";

interface TodayWorkoutCardProps {
    splitOrder: string[];
    weekWorkouts: Array<{ start_time: string; name: string | null }>;
    todayWorkout: { name: string | null } | null;
    onStartWorkout?: (workoutName: string) => void;
}

export function TodayWorkoutCard({ splitOrder, weekWorkouts, todayWorkout: initialTodayWorkout, onStartWorkout }: TodayWorkoutCardProps) {
    const [todayWorkout, setTodayWorkout] = useState<string | null>(null);

    // Get today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const getTodayDayIndex = () => {
        const now = new Date();
        const day = now.getDay();
        // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
        return day === 0 ? 6 : day - 1;
    };

    // Get start of current week (Monday)
    const getWeekStart = () => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    useEffect(() => {
        // If workout was done today, use that name
        if (initialTodayWorkout?.name) {
            setTodayWorkout(initialTodayWorkout.name);
            return;
        }

        // Calculate next workout based on completed workouts this week
        if (splitOrder.length === 0) {
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        // Filter workouts from Monday to yesterday
        const weekStart = getWeekStart();
        const pastWeekWorkouts = weekWorkouts.filter((workout) => {
            const workoutDate = new Date(workout.start_time);
            return workoutDate >= weekStart && workoutDate <= yesterday;
        });

        // Find the last completed workout's index in split order
        let lastWorkoutIndex = -1;
        if (pastWeekWorkouts.length > 0) {
            // Get unique workout days and find the last one
            const workoutDays = new Map<string, string>();
            pastWeekWorkouts.forEach((workout) => {
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
    }, [initialTodayWorkout, splitOrder, weekWorkouts]);

    const handleStartWorkout = () => {
        if (!todayWorkout) return;

        if (onStartWorkout) {
            onStartWorkout(todayWorkout);
        }
    };

    if (!todayWorkout) {
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
