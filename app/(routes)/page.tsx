"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHomeDataStore, useUserStore } from "@/stores";
import { getWorkoutByName } from "@/services";
import {
    WeeklyGoalProgress,
    SplitConfig,
    WeeklySchedule,
    TodayWorkoutCard,
    ActiveSessionDrawer,
    type ExerciseItem,
} from "@/components";

export default function Home() {
    const { t } = useTranslation();
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [activeSessionInitialData, setActiveSessionInitialData] = useState<ExerciseItem[] | undefined>(undefined);
    const [activeSessionInitialName, setActiveSessionInitialName] = useState<string | undefined>(undefined);
    const { homeData, isLoading, refreshHomeData, fetchHomeData } = useHomeDataStore();

    useEffect(() => {
        fetchHomeData();
    }, [fetchHomeData]);

    const handleStartWorkout = async (workoutName: string) => {
        try {
            const userId = await useUserStore.getState().getUserId();
            const workout = await getWorkoutByName(userId, workoutName);

            if (workout) {
                const initialData: ExerciseItem[] = workout.exercises.map((ex) => ({
                    id: crypto.randomUUID(),
                    name: ex.name,
                    sets: ex.sets.map((set) => ({
                        id: crypto.randomUUID(),
                        weight: set.weight,
                        reps: set.reps,
                        isCompleted: false,
                    })),
                }));

                setActiveSessionInitialData(initialData);
                setActiveSessionInitialName(workoutName);
                setIsWorkoutActive(true);
            } else {
                setActiveSessionInitialData(undefined);
                setActiveSessionInitialName(workoutName);
                setIsWorkoutActive(true);
            }
        } catch (error) {
            console.error("Error starting workout:", error);
            setActiveSessionInitialData(undefined);
            setActiveSessionInitialName(workoutName);
            setIsWorkoutActive(true);
        }
    };

    const handleDataRefresh = () => {
        refreshHomeData();
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">{t('home.title')}</h1>
                <div className="space-y-4">
                    <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
                    <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
                    <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">{t('home.title')}</h1>
            {homeData && (
                <>
                    <WeeklyGoalProgress
                        weeklyGoal={homeData.weeklyGoal}
                        weekWorkouts={homeData.weekWorkouts}
                        onDataChange={handleDataRefresh}
                    />
                    <SplitConfig
                        splitConfig={homeData.splitConfig}
                        workoutNames={homeData.workoutNames}
                        onDataChange={handleDataRefresh}
                    />
                    <WeeklySchedule
                        splitOrder={homeData.splitConfig?.split_order ?? []}
                        weekWorkouts={homeData.weekWorkouts}
                        allWorkouts={homeData.allWorkouts}
                    />
                    <TodayWorkoutCard
                        splitOrder={homeData.splitConfig?.split_order ?? []}
                        weekWorkouts={homeData.weekWorkouts}
                        todayWorkout={homeData.todayWorkout}
                        todayWorkoutDetail={homeData.todayWorkoutDetail}
                        onStartWorkout={handleStartWorkout}
                    />
                </>
            )}

            <ActiveSessionDrawer
                isOpen={isWorkoutActive}
                onClose={() => {
                    setIsWorkoutActive(false);
                    setActiveSessionInitialData(undefined);
                    setActiveSessionInitialName(undefined);
                    handleDataRefresh();
                }}
                initialData={activeSessionInitialData}
                initialWorkoutName={activeSessionInitialName}
            />
        </div>
    );
}



