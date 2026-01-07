"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const [exerciseName, setExerciseName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exerciseName.trim()) {
      onAdd(exerciseName.trim());
      setExerciseName("");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Exercise</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="exerciseName" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Exercise Name
            </label>
            <input
              id="exerciseName"
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Bench Press"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!exerciseName.trim()}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
          >
            Add to Workout
          </button>
        </form>
      </div>
    </div>
  );
}
