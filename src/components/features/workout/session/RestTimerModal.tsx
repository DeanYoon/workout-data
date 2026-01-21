"use client";

import { useTranslation } from "react-i18next";
import { Plus, Minus, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "@/utils";

interface RestTimerModalProps {
    isOpen: boolean;
    secondsRemaining: number;
    totalSeconds: number; // For progress calculation
    onAddSeconds: (seconds: number) => void;
    onSkip: () => void;
}

export function RestTimerModal({
    isOpen,
    secondsRemaining,
    totalSeconds,
    onAddSeconds,
    onSkip,
}: RestTimerModalProps) {
    const { t } = useTranslation();
    // Calculate progress for the circle (0 to 1)
    // When secondsRemaining == totalSeconds, progress is 1.
    // When 0, progress is 0.
    const progress = Math.min(Math.max(secondsRemaining / totalSeconds, 0), 1);
    const circumference = 2 * Math.PI * 120; // Radius 120
    const strokeDashoffset = circumference * (1 - progress);

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
                        onClick={onSkip} // clicking outside skips/closes
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900"
                    >
                        <div className="flex flex-col items-center">
                            <h3 className="mb-8 text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('workout.restingTitle')}</h3>

                            {/* Pomodoro Circle Timer */}
                            <div className="relative mb-8 flex items-center justify-center">
                                {/* Background Circle */}
                                <svg className="h-64 w-64 -rotate-90 transform">
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-zinc-100 dark:text-zinc-800"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="120"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        className="text-blue-500 transition-all duration-1000 ease-linear"
                                        style={{
                                            strokeDasharray: circumference,
                                            strokeDashoffset: strokeDashoffset,
                                        }}
                                    />
                                </svg>

                                {/* Time Display */}
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-5xl font-mono font-bold tracking-tighter text-zinc-900 dark:text-zinc-50">
                                        {formatTime(secondsRemaining)}
                                    </span>
                                    <span className="text-sm font-medium text-zinc-500 mt-2">{t('workout.nextSet')}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid w-full grid-cols-3 gap-3">
                                <button
                                    onClick={() => onAddSeconds(-10)}
                                    className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-100 p-3 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Minus className="h-5 w-5" />
                                    <span className="text-xs font-semibold">-10s</span>
                                </button>

                                <button
                                    onClick={() => onAddSeconds(10)}
                                    className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-100 p-3 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                    <span className="text-xs font-semibold">+10s</span>
                                </button>

                                <button
                                    onClick={onSkip}
                                    className="flex flex-col items-center gap-1 rounded-2xl bg-red-50 p-3 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                                >
                                    <SkipForward className="h-5 w-5" />
                                    <span className="text-xs font-semibold">{t('workout.skip')}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}



