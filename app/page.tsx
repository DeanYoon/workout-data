"use client";

import { useState } from "react";
import { WeeklyGoalProgress } from "./components/WeeklyGoalProgress";
import { SplitConfig } from "./components/SplitConfig";
import { WeeklySchedule } from "./components/WeeklySchedule";
import { TodayWorkoutCard } from "./components/TodayWorkoutCard";
import { ActiveSessionDrawer } from "./workout/components/ActiveSessionDrawer";
import { supabase } from "@/lib/supabase";
import { WorkoutWithDetails } from "@/types/workout";
import { ExerciseItem } from "./workout/components/ExerciseCard";

export default function Home() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [activeSessionInitialData, setActiveSessionInitialData] = useState<ExerciseItem[] | undefined>(undefined);
  const [activeSessionInitialName, setActiveSessionInitialName] = useState<string | undefined>(undefined);

  const handleStartWorkout = async (workoutName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      // Find the workout by name
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (
            *,
            sets (*)
          )
        `)
        .eq("user_id", userId)
        .eq("is_disabled", false)
        .eq("name", workoutName)
        .order("start_time", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching workout:", error);
        // Start with empty workout if not found
        setActiveSessionInitialData(undefined);
        setActiveSessionInitialName(workoutName);
        setIsWorkoutActive(true);
        return;
      }

      if (data && data.length > 0) {
        const workout = data[0] as any;
        const formattedWorkout: WorkoutWithDetails = {
          ...workout,
          exercises: workout.exercises
            .sort((a: any, b: any) => a.order - b.order)
            .map((e: any) => ({
              ...e,
              sets: e.sets.sort((a: any, b: any) => a.order - b.order)
            }))
        };

        const initialData: ExerciseItem[] = formattedWorkout.exercises.map((ex) => ({
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
        // No previous workout found, start new one
        setActiveSessionInitialData(undefined);
        setActiveSessionInitialName(workoutName);
        setIsWorkoutActive(true);
      }
    } catch (error) {
      console.error("Error starting workout:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      <WeeklyGoalProgress />
      <SplitConfig />
      <WeeklySchedule />
      <TodayWorkoutCard onStartWorkout={handleStartWorkout} />
      <p className="text-zinc-500">Welcome to your fitness dashboard.</p>

      <ActiveSessionDrawer
        isOpen={isWorkoutActive}
        onClose={() => {
          setIsWorkoutActive(false);
          setActiveSessionInitialData(undefined);
          setActiveSessionInitialName(undefined);
        }}
        initialData={activeSessionInitialData}
        initialWorkoutName={activeSessionInitialName}
      />
    </div>
  );
}
