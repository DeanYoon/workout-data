"use client";

import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface WorkoutSummaryModalProps {
    isOpen: boolean;
    totalTime: string;
    totalVolume: number;
    totalSets: number;
    isSaving: boolean;
    initialName?: string;
    isNameEditable?: boolean; // Whether name can be edited
    onSave: (name: string) => void;
    onCancel: () => void;
}

export function WorkoutSummaryModal({
    isOpen,
    totalTime,
    totalVolume,
    totalSets,
    isSaving,
    initialName = "",
    isNameEditable = true,
    onSave,
    onCancel,
}: WorkoutSummaryModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(initialName);

    // Sync with prop when opening
    useEffect(() => {
        if (isOpen) {
            setName(initialName);
        }
    }, [isOpen, initialName]);

    const handleSaveClick = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={!isSaving ? onCancel : undefined}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>

                            <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                {t('workout.summaryComplete')}
                            </h2>
                            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                                {isNameEditable ? t('workout.summaryConfirmName') : t('workout.summaryWillSave')}
                            </p>

                            {/* Name Input */}
                            <div className="w-full mb-6">
                                <label htmlFor="workoutName" className="sr-only">Workout Name</label>
                                {isNameEditable ? (
                                    <input
                                        id="workoutName"
                                        type="text"
                                        placeholder={t('workout.summaryNamePlaceholder')}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center font-medium dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 text-zinc-600 dark:text-zinc-400">
                                        {name || t('workout.untitled')}
                                    </div>
                                )}
                            </div>

                            <div className="mb-8 grid w-full grid-cols-3 gap-4">
                                <div className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('workout.time')}</span>
                                    <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalTime}</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('workout.volume')}</span>
                                    <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalVolume}kg</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('workout.sets')}</span>
                                    <span className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{totalSets}</span>
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={handleSaveClick}
                                    disabled={isSaving || !name.trim()}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            {t('workout.saving')}
                                        </>
                                    ) : (
                                        t('workout.saveFinish')
                                    )}
                                </button>
                                <button
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="w-full rounded-xl py-3.5 font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-300"
                                >
                                    {t('workout.cancel')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}



