"use client";

import { Calendar, Clock, Dumbbell } from "lucide-react";

interface WorkoutHistoryItemProps {
  date: string;
  duration: string;
  totalWeight: number;
  workoutName: string;
}

export function WorkoutHistoryCard({
  date,
  duration,
  totalWeight,
  workoutName,
}: WorkoutHistoryItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 dark:shadow-zinc-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{date}</span>
      </div>
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{workoutName}</h3>
      
      <div className="mt-auto flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Dumbbell className="h-3 w-3" />
          <span>{totalWeight}kg</span>
        </div>
      </div>
    </div>
  );
}
