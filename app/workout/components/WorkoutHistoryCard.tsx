"use client";

import { useState } from "react";
import { Clock, Dumbbell, Trash2 } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface WorkoutHistoryItemProps {
  id: string; // Added ID
  date: string;
  duration: string;
  totalWeight: number;
  workoutName: string;
  onDelete: (id: string) => void; // Callback for delete
  onClick: () => void; // Callback for click
}

export function WorkoutHistoryCard({
  id,
  date,
  duration,
  totalWeight,
  workoutName,
  onDelete,
  onClick,
}: WorkoutHistoryItemProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(id);
    setIsDeleteModalOpen(false);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer dark:bg-zinc-900 dark:shadow-zinc-800"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{date}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{workoutName || "Untitled Workout"}</h3>
          <button
            onClick={handleDeleteClick}
            className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Dumbbell className="h-3 w-3" />
            <span>{totalWeight}kg</span>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Workout?"
        message={`Are you sure you want to remove "${workoutName || "Untitled Workout"}" from your history?`}
        subMessage="Your exercise data will remain intact."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
