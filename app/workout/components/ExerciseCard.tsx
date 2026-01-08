"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useState, useRef } from "react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export interface ExerciseSet {
  id: string;
  weight: number;
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

interface ExerciseSetRowProps {
  set: ExerciseSet;
  index: number;
  exerciseId: string;
  onUpdateSet: (exerciseId: string, setId: string, field: "weight" | "reps" | "isCompleted", value: number | boolean) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
}

function ExerciseSetRow({ set, index, exerciseId, onUpdateSet, onRemoveSet }: ExerciseSetRowProps) {
  const x = useMotionValue(0);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Swipe Logic
  const handlePan = (event: Event, info: PanInfo) => {
    // Only allow swiping left
    let newX = x.get() + info.delta.x;
    // Clamp values: 0 to -60 (just enough to toggle)
    if (newX > 0) newX = 0;
    if (newX < -60) newX = -60;
    x.set(newX);
  };

  const handlePanEnd = () => {
    const currentX = x.get();
    if (currentX < -30) {
      // Snap to delete state
      animate(x, -50, { type: "spring", stiffness: 400, damping: 30 });
      setIsDeleteMode(true);
    } else {
      // Snap back to normal
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      setIsDeleteMode(false);
    }
  };

  // Button Transforms
  // Check Button: Slide Left (-20px) and Fade Out
  const checkOpacity = useTransform(x, [0, -40], [1, 0]);
  const checkX = useTransform(x, [0, -40], [0, -20]);
  const checkScale = useTransform(x, [0, -40], [1, 0.8]);
  const checkPointerEvents = useTransform(x, (latest) => latest < -25 ? "none" : "auto");

  // Delete Button: Slide In (from 20px) and Fade In
  const deleteOpacity = useTransform(x, [-10, -50], [0, 1]);
  const deleteX = useTransform(x, [-10, -50], [20, 0]);
  const deleteScale = useTransform(x, [-10, -50], [0.8, 1]);
  const deletePointerEvents = useTransform(x, (latest) => latest < -25 ? "auto" : "none");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`relative overflow-hidden ${set.isCompleted
        ? "bg-green-50/50 dark:bg-green-900/10"
        : "even:bg-zinc-50/50 dark:even:bg-zinc-900/50"
        }`}
    >
      <motion.div
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ touchAction: "pan-y" }}
        className="grid grid-cols-10 gap-2 px-4 py-2 items-center"
      >
        <div className="col-span-1 text-center font-medium text-zinc-500">
          {index + 1}
        </div>

        <div className="col-span-3">
          <input
            type="number"
            value={set.weight || ""}
            onChange={(e) =>
              onUpdateSet(exerciseId, set.id, "weight", Number(e.target.value))
            }
            className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${set.isCompleted
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
              onUpdateSet(exerciseId, set.id, "reps", Number(e.target.value))
            }
            className={`w-full rounded-md border bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${set.isCompleted
              ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
              : "border-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              }`}
            placeholder="0"
          />
        </div>

        {/* Action Button Container */}
        <div className="col-span-3 flex justify-center relative h-8">
          {/* Check Button (Done) */}
          <motion.button
            style={{
              opacity: checkOpacity,
              x: checkX,
              scale: checkScale,
              pointerEvents: checkPointerEvents,
            }}
            onClick={() => onUpdateSet(exerciseId, set.id, "isCompleted", !set.isCompleted)}
            className={`absolute inset-0 flex items-center justify-center rounded-md transition-colors ${set.isCompleted
              ? "bg-green-500 text-white shadow-sm hover:bg-green-600"
              : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
              }`}
          >
            <Check className={`h-4 w-4 ${set.isCompleted ? "stroke-[3px]" : ""}`} />
          </motion.button>

          {/* Delete Button (X) */}
          <motion.button
            style={{
              opacity: deleteOpacity,
              x: deleteX,
              scale: deleteScale,
              pointerEvents: deletePointerEvents,
            }}
            onClick={() => setIsDeleteModalOpen(true)}
            className="absolute inset-0 flex items-center justify-center rounded-md bg-red-500 text-white shadow-sm hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Set?"
        message="Are you sure you want to remove this set?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          onRemoveSet(exerciseId, set.id);
          setIsDeleteModalOpen(false);
          setIsDeleteMode(false);
          animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setIsDeleteMode(false);
          animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }}
      />
    </motion.div>
  );
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  onRemove,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: ExerciseCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 dark:border-zinc-800">
        <h3 className="font-semibold text-blue-600 dark:text-blue-400">
          {exerciseIndex + 1}. {exercise.name}
        </h3>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
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
      <div className="flex flex-col overflow-hidden">
        <AnimatePresence initial={false}>
          {exercise.sets.map((set, index) => (
            <ExerciseSetRow
              key={set.id}
              set={set}
              index={index}
              exerciseId={exercise.id}
              onUpdateSet={onUpdateSet}
              onRemoveSet={onRemoveSet}
            />
          ))}
        </AnimatePresence>
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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Exercise?"
        message={`Are you sure you want to remove "${exercise.name}"?`}
        subMessage="All sets for this exercise will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          onRemove(exercise.id);
          setIsDeleteModalOpen(false);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
