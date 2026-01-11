"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { WorkoutWithDetails } from "@/types/workout";
import { WorkoutDetailView } from "./WorkoutDetailView";

interface WorkoutDetailModalProps {
  selectedDate: Date;
  selectedWorkout: WorkoutWithDetails | null;
  isLoadingWorkout: boolean;
  onClose: () => void;
}

export function WorkoutDetailModal({
  selectedDate,
  selectedWorkout,
  isLoadingWorkout,
  onClose,
}: WorkoutDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="fixed inset-x-4 bottom-4 z-[70] bg-white dark:bg-zinc-900 rounded-2xl p-4 max-h-[50vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {format(selectedDate, "yyyy년 M월 d일 (E)", { locale: ko })}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {isLoadingWorkout ? (
          <div className="flex items-center justify-center py-6">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">로딩 중...</div>
          </div>
        ) : selectedWorkout ? (
          <WorkoutDetailView workout={selectedWorkout} showStatus={true} variant="modal" />
        ) : (
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center text-zinc-600 dark:text-zinc-400">
            이 날 운동 기록이 없습니다
          </div>
        )}
      </div>
    </>
  );
}
