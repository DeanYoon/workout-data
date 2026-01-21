"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { formatDateLong } from "@/utils";
import { useSettingsStore } from "@/stores";
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
    const { t } = useTranslation();
    const language = useSettingsStore((s) => s.language);
    const modalRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            <div
                ref={modalRef}
                className="fixed inset-x-4 bottom-4 z-[70] bg-white dark:bg-zinc-900 rounded-2xl max-h-[50vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {formatDateLong(selectedDate, language)}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 pt-3">
                    {isLoadingWorkout ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">{t('workout.loading')}</div>
                        </div>
                    ) : selectedWorkout ? (
                        <WorkoutDetailView workout={selectedWorkout} showStatus={true} variant="modal" />
                    ) : (
                        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-4 text-center text-zinc-600 dark:text-zinc-400">
                            {t('workout.noRecordForDate')}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}



