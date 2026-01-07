"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";

export interface ExerciseSet {
  id: string;
  weight: number; // or string if you want to allow empty input easier, but number requested
  reps: number;
  isCompleted: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

interface ExerciseCardProps {
  exercise: ExerciseItem;
  exerciseIndex: number;
  onRemove: (id: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: "weight" | "reps" | "isCompleted", value: number | boolean) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  onRemove,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: ExerciseCardProps) {
  
  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 dark:border-zinc-800">
        <h3 className="font-semibold text-blue-600 dark:text-blue-400">
          {exerciseIndex + 1}. {exercise.name}
        </h3>
        <button
          onClick={() => onRemove(exercise.id)}
          className="text-zinc-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-10 gap-2 px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide text-center">
        <div className="col-span-1">Set</div>
        <div className="col-span-3">kg</div>
        <div className="col-span-3">Reps</div>
        <div className="col-span-3">Done</div>
      </div>

      {/* Sets */}
      <div className="flex flex-col">
        {exercise.sets.map((set, index) => (
          <div
            key={set.id}
            className={`grid grid-cols-10 gap-2 px-4 py-2 items-center transition-colors ${
              set.isCompleted
                ? "bg-green-50/50 dark:bg-green-900/10"
                : "even:bg-zinc-50/50 dark:even:bg-zinc-900/50"
            }`}
          >
            <div className="col-span-1 text-center font-medium text-zinc-500">
              {index + 1}
            </div>
            
            <div className="col-span-3">
              <input
                type="number"
                value={set.weight || ""}
                onChange={(e) =>
                  onUpdateSet(exercise.id, set.id, "weight", Number(e.target.value))
                }
                className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  set.isCompleted 
                    ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400" 
                    : "border-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                }`}
                placeholder="0"
              />
            </div>

            <div className="col-span-3">
              <input
                type="number"
                value={set.reps || ""}
                onChange={(e) =>
                  onUpdateSet(exercise.id, set.id, "reps", Number(e.target.value))
                }
                className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${
                  set.isCompleted 
                    ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400" 
                    : "border-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                }`}
                placeholder="0"
              />
            </div>

            <div className="col-span-3 flex justify-center">
              <button
                onClick={() => onUpdateSet(exercise.id, set.id, "isCompleted", !set.isCompleted)}
                className={`flex h-8 w-full items-center justify-center rounded-md transition-all ${
                  set.isCompleted
                    ? "bg-green-500 text-white shadow-sm hover:bg-green-600"
                    : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
                }`}
              >
                <Check className={`h-4 w-4 ${set.isCompleted ? "stroke-[3px]" : ""}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      <div className="p-3">
        <button
          onClick={() => onAddSet(exercise.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-50 py-2.5 text-sm font-semibold text-blue-600 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-blue-400 dark:hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add Set
        </button>
      </div>
    </div>
  );
}
