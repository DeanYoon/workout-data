"use client";

import { Check, X } from "lucide-react";
import { DaySchedule } from "./types";

interface WeeklyViewProps {
  schedule: DaySchedule[];
  onExpand: () => void;
}

export function WeeklyView({ schedule, onExpand }: WeeklyViewProps) {
  return (
    <div
      className="grid grid-cols-7 cursor-pointer"
      onClick={onExpand}
    >
      {schedule.map((day, index) => (
        <div
          key={index}
          className={`flex flex-col items-center gap-2 p-1 rounded-xl ${
            day.isToday
              ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : ""
          }`}
        >
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {day.dayLabel}
          </span>

          {day.hasWorkout ? (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
              <Check className="h-4 w-4 text-white" />
            </div>
          ) : day.isPast ? (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500">
              <X className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed border-zinc-400 dark:border-zinc-600" />
          )}

          {day.workoutNameShort && (
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {day.workoutNameShort}
            </span>
          )}

          {day.isToday && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Today
            </span>
          )}
        </div>
      ))}
    </div>
  );
}



