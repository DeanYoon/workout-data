"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [existingExercises, setExistingExercises] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unique exercise names on mount (or open)
  useEffect(() => {
    if (isOpen) {
      const fetchExercises = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("exercises")
            .select("name");

          if (error) throw error;

          if (data) {
            // Unique names, case-insensitive logic handled by using Set with normalized strings if desired
            // But for display we keep original casing.
            const names = Array.from(new Set(data.map((e) => e.name))).sort();
            setExistingExercises(names);
          }
        } catch (error) {
          console.error("Error fetching exercise names:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchExercises();
      setSearchTerm("");
    }
  }, [isOpen]);

  // Filter exercises based on search term
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return existingExercises.filter((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, existingExercises]);

  const handleSelect = (name: string) => {
    onAdd(name);
    setSearchTerm("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="flex h-[80vh] w-full max-w-sm flex-col rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Exercise</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {/* Create New Option */}
              {searchTerm && (
                <button
                  onClick={() => handleSelect(searchTerm)}
                  className="flex w-full items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-left font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <span className="truncate">Create "{searchTerm}"</span>
                </button>
              )}

              {/* Existing Options */}
              {filteredExercises.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelect(name)}
                  className="w-full rounded-xl px-4 py-3 text-left font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {name}
                </button>
              ))}

              {!searchTerm && existingExercises.length > 0 && (
                <div className="px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Suggestions
                </div>
              )}
              {!searchTerm && existingExercises.slice(0, 10).map((name) => (
                <button
                  key={`suggestion-${name}`}
                  onClick={() => handleSelect(name)}
                  className="w-full rounded-xl px-4 py-3 text-left font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {name}
                </button>
              ))}

              {!searchTerm && existingExercises.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No exercises found. Type to create one.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
