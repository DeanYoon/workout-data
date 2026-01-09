"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface WeeklyGoalModalProps {
    isOpen: boolean;
    currentGoal: number | null;
    onSave: (goal: number) => void;
    onClose: () => void;
}

export function WeeklyGoalModal({
    isOpen,
    currentGoal,
    onSave,
    onClose,
}: WeeklyGoalModalProps) {
    const [selectedGoal, setSelectedGoal] = useState<number>(currentGoal || 3);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedGoal(currentGoal || 3);
            setIsSaving(false);
        }
    }, [isOpen, currentGoal]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(selectedGoal);
            onClose();
        } catch (error) {
            console.error("Error saving goal:", error);
        } finally {
            setIsSaving(false);
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
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex flex-col">
                            <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                주간 목표 설정
                            </h2>
                            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                                주당 운동 횟수를 선택하세요 (최대 7회)
                            </p>

                            {/* Select Input */}
                            <div className="mb-6">
                                <label htmlFor="weeklyGoal" className="sr-only">
                                    주간 목표
                                </label>
                                <select
                                    id="weeklyGoal"
                                    value={selectedGoal}
                                    onChange={(e) => setSelectedGoal(Number(e.target.value))}
                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-lg font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    {Array.from({ length: 7 }, (_, i) => i + 1).map((num) => (
                                        <option key={num} value={num}>
                                            {num}회
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? "저장 중..." : "저장"}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className="w-full rounded-xl py-3.5 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 disabled:opacity-50"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
