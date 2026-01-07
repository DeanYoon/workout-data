"use client";

import { useEffect, useState } from "react";
import { Plus, Timer, X } from "lucide-react";
import { AddExerciseModal } from "./AddExerciseModal";

interface ActiveSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExerciseItem {
  id: string;
  name: string;
}

export function ActiveSessionDrawer({ isOpen, onClose }: ActiveSessionDrawerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
      setRestTime(0);
      setExercises([]);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddExercise = (name: string) => {
    const newExercise: ExerciseItem = {
      id: crypto.randomUUID(),
      name,
    };
    setExercises((prev) => [...prev, newExercise]);
    setIsAddModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-black animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 dark:border-zinc-800">
          <div className="flex flex-col items-center w-20">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Rest</span>
             <span className="font-mono text-sm font-medium">{formatTime(restTime)}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Duration</span>
            <span className="font-mono text-2xl font-bold tracking-tight">{formatTime(elapsedTime)}</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 w-20"
          >
            Finish
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {exercises.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-500">
              <DumbbellIcon className="mb-4 h-12 w-12 opacity-20" />
              <p>No exercises added yet.</p>
              <p className="text-sm">Tap the button below to start.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{index + 1}. {exercise.name}</h3>
                    <button className="text-zinc-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Sets would go here */}
                  <div className="text-sm text-zinc-500 italic">Sets setup coming soon...</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4 pb-safe dark:bg-black dark:border-zinc-800">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3.5 font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
          >
            <Plus className="h-5 w-5" />
            Add Exercise
          </button>
        </div>
      </div>

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExercise}
      />
    </>
  );
}

function DumbbellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </svg>
  );
}
