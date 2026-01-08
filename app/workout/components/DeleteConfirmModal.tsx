"use client";

import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title = "Delete?",
  message,
  subMessage,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
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
            onClick={onCancel}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">


              <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
              <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                {message}
                {subMessage && (
                  <>
                    <br />
                    <span className="text-xs">{subMessage}</span>
                  </>
                )}
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white transition-colors hover:bg-red-700"
                >
                  {confirmText}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full rounded-xl py-3.5 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
