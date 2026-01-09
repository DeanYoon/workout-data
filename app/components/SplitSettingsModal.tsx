"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SplitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (splitNames: string[]) => void;
  currentSplitNames: string[];
}

export function SplitSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentSplitNames,
}: SplitSettingsModalProps) {
  const [splitNames, setSplitNames] = useState<string[]>(currentSplitNames);
  const [newSplitName, setNewSplitName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSplitNames(currentSplitNames);
      setNewSplitName("");
    }
  }, [isOpen, currentSplitNames]);

  const handleAdd = () => {
    const trimmed = newSplitName.trim();
    if (trimmed && !splitNames.includes(trimmed)) {
      setSplitNames([...splitNames, trimmed]);
      setNewSplitName("");
    }
  };

  const handleRemove = (index: number) => {
    setSplitNames(splitNames.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (splitNames.length === 0) {
      alert("최소 하나의 분할을 설정해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      // Check if user_settings exists
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("user_settings")
          .update({ split_names: splitNames })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("user_settings")
          .insert({
            user_id: userId,
            split_names: splitNames,
          });

        if (error) throw error;
      }

      onSave(splitNames);
      onClose();
    } catch (error) {
      console.error("Error saving split settings:", error);
      alert("설정 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">분할 루틴 설정</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            분할 목록
          </label>
          <div className="space-y-2">
            {splitNames.map((name, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800"
              >
                <span className="font-medium">{name}</span>
                <button
                  onClick={() => handleRemove(index)}
                  className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            새 분할 추가
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSplitName}
              onChange={(e) => setNewSplitName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              placeholder="예: 상체, 하체, 휴식"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              onClick={handleAdd}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || splitNames.length === 0}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
