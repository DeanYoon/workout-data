"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

interface SplitOrderModalProps {
  isOpen: boolean;
  splitCount: number;
  workoutNames: string[];
  currentOrder: string[] | null;
  onSave: (order: string[]) => void;
  onClose: () => void;
}

export function SplitOrderModal({
  isOpen,
  splitCount,
  workoutNames,
  currentOrder,
  onSave,
  onClose,
}: SplitOrderModalProps) {
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number>(0);
  const [isSelectingWorkout, setIsSelectingWorkout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWorkoutName, setSelectedWorkoutName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentOrder && currentOrder.length === splitCount) {
        setSelectedOrder(currentOrder);
      } else {
        setSelectedOrder(Array(splitCount).fill(""));
      }
      setCurrentEditingIndex(0);
      setIsSelectingWorkout(false);
      setIsSaving(false);
      setSelectedWorkoutName(null);
    }
  }, [isOpen, splitCount, currentOrder]);

  const handleSelectWorkout = (workoutName: string) => {
    // Show selected state
    setSelectedWorkoutName(workoutName);

    // After 0.5 seconds, save and move to next
    setTimeout(() => {
      const newOrder = [...selectedOrder];
      newOrder[currentEditingIndex] = workoutName;
      setSelectedOrder(newOrder);
      setSelectedWorkoutName(null);

      // Move to next split if available
      const nextIndex = currentEditingIndex + 1;
      if (nextIndex < splitCount) {
        setCurrentEditingIndex(nextIndex);
      } else {
        setIsSelectingWorkout(false);
      }
    }, 500);
  };

  const handleSave = async () => {
    if (selectedOrder.some((name) => !name)) {
      alert("모든 분할에 운동을 선택해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(selectedOrder);
      onClose();
    } catch (error) {
      console.error("Error saving split order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = selectedOrder.every((name) => name !== "");

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
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[90vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col flex-1 overflow-hidden">
              <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                분할 순서 설정
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                각 분할에 운동 프로그램을 선택하세요
              </p>

              {!isSelectingWorkout ? (
                <>
                  {/* Split Order List */}
                  <div className="flex-1 overflow-y-auto mb-6 space-y-3">
                    {Array.from({ length: splitCount }, (_, i) => i).map((index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setCurrentEditingIndex(index);
                          setIsSelectingWorkout(true);
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedOrder[index]
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {selectedOrder[index] || "운동 선택"}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-400" />
                      </div>
                    ))}
                  </div>

                  <div className="flex w-full flex-col gap-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !isComplete}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "저장 중..." : "확인"}
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isSaving}
                      className="w-full rounded-xl py-3.5 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Workout Selection */}
                  <div className="flex-1 overflow-y-auto mb-6">
                    <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {currentEditingIndex + 1}분할 운동 선택
                    </p>
                    <div className="space-y-2">
                      {workoutNames.length === 0 ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                          저장된 운동 프로그램이 없습니다.
                          <br />
                          먼저 운동을 저장해주세요.
                        </p>
                      ) : (
                        workoutNames.map((name) => (
                          <button
                            key={name}
                            onClick={() => handleSelectWorkout(name)}
                            disabled={selectedWorkoutName !== null}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${selectedWorkoutName === name
                                ? "border-blue-600 bg-blue-600 text-white scale-95"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <span className={`font-medium ${selectedWorkoutName === name
                                ? "text-white"
                                : "text-zinc-900 dark:text-zinc-100"
                              }`}>
                              {name}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSelectingWorkout(false)}
                    className="w-full rounded-xl py-3.5 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  >
                    뒤로
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
