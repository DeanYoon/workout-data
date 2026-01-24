"use client";

import { useTranslation } from "react-i18next";
import { Play, X } from "lucide-react";
import { formatDateLong } from "@/utils";
import { useSettingsStore } from "@/stores";
import { WorkoutWithDetails } from "@/types/workout";
import { WorkoutDetailView } from "./WorkoutDetailView";

interface WorkoutDetailDrawerProps {
  workout: WorkoutWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStartRoutine: (workout: WorkoutWithDetails) => void;
}

export function WorkoutDetailDrawer({
  workout,
  isOpen,
  onClose,
  onStartRoutine,
}: WorkoutDetailDrawerProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  if (!isOpen || !workout) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85vh] flex-col rounded-t-3xl bg-white dark:bg-zinc-900 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {workout.name || t('workout.untitled')}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatDateLong(new Date(workout.start_time), language)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <WorkoutDetailView workout={workout} variant="drawer" />
        </div>

        {/* Footer Action */}
        <div className="border-t bg-white p-4 pb-safe dark:bg-zinc-900 dark:border-zinc-800">
          <button
            onClick={() => onStartRoutine(workout)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            {t('workout.startWithRoutine')}
          </button>
        </div>
      </div>
    </>
  );
}



