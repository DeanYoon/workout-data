"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SplitCountModal } from "./SplitCountModal";
import { SplitOrderModal } from "./SplitOrderModal";

interface SplitConfigData {
  split_count: number;
  split_order: string[];
}

export function SplitConfig() {
  const [splitConfig, setSplitConfig] = useState<SplitConfigData | null>(null);
  const [workoutNames, setWorkoutNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [pendingSplitCount, setPendingSplitCount] = useState<number | null>(null);

  const fetchWorkoutNames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const { data, error } = await supabase
        .from("workouts")
        .select("name")
        .eq("user_id", userId)
        .eq("is_disabled", false)
        .not("name", "is", null);

      if (error) {
        console.error("Error fetching workout names:", error);
        return;
      }

      if (data) {
        const uniqueNames = Array.from(
          new Set(data.map((w) => w.name).filter(Boolean))
        ) as string[];
        setWorkoutNames(uniqueNames);
      }
    } catch (error) {
      console.error("Error fetching workout names:", error);
    }
  };

  const fetchSplitConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const { data, error } = await supabase
        .from("split_config")
        .select("split_count, split_order")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching split config:", error);
        return;
      }

      if (data) {
        setSplitConfig({
          split_count: data.split_count,
          split_order: data.split_order as string[],
        });
      }
    } catch (error) {
      console.error("Error fetching split config:", error);
    }
  };

  const saveSplitCount = async (count: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      // First save split count
      const { error: configError } = await supabase
        .from("split_config")
        .upsert(
          {
            user_id: userId,
            split_count: count,
            split_order: [],
          },
          {
            onConflict: "user_id",
          }
        )
        .select();

      if (configError) {
        console.error("Error saving split count:", configError);
        alert("분할 수 저장에 실패했습니다: " + configError.message);
        throw configError;
      }

      // Update local state
      setSplitConfig({
        split_count: count,
        split_order: [],
      });
      setPendingSplitCount(count);

      // Fetch workout names and open order modal
      await fetchWorkoutNames();
      setIsCountModalOpen(false);
      setIsOrderModalOpen(true);
    } catch (error) {
      console.error("Error saving split count:", error);
      throw error;
    }
  };

  const saveSplitOrder = async (order: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || "anon_user";

      const { data: currentConfig } = await supabase
        .from("split_config")
        .select("split_count")
        .eq("user_id", userId)
        .single();

      if (!currentConfig) {
        alert("분할 수를 먼저 설정해주세요.");
        return;
      }

      const { error } = await supabase
        .from("split_config")
        .upsert(
          {
            user_id: userId,
            split_count: currentConfig.split_count,
            split_order: order,
          },
          {
            onConflict: "user_id",
          }
        )
        .select();

      if (error) {
        console.error("Error saving split order:", error);
        alert("분할 순서 저장에 실패했습니다: " + error.message);
        throw error;
      }

      setSplitConfig({
        split_count: currentConfig.split_count,
        split_order: order,
      });
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error("Error saving split order:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSplitConfig(), fetchWorkoutNames()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    // If no config exists, show count modal on mount
    if (!isLoading && !splitConfig && !isCountModalOpen && !isOrderModalOpen) {
      setIsCountModalOpen(true);
    }
  }, [isLoading, splitConfig, isCountModalOpen, isOrderModalOpen]);

  if (isLoading) {
    return null;
  }

  const handleEdit = () => {
    if (workoutNames.length === 0) {
      alert("먼저 운동 프로그램을 저장해주세요.");
      return;
    }
    // Show order modal to edit the split order
    setIsOrderModalOpen(true);
  };

  const handleChangeSplitCount = () => {
    setIsCountModalOpen(true);
  };

  if (!splitConfig) {
    return (
      <>
        <div
          onClick={() => setIsCountModalOpen(true)}
          className="mb-4 cursor-pointer rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            분할 운동을 설정하세요
          </p>
        </div>
        <SplitCountModal
          isOpen={isCountModalOpen}
          currentCount={null}
          onSave={saveSplitCount}
          onClose={() => setIsCountModalOpen(false)}
        />
        <SplitOrderModal
          isOpen={isOrderModalOpen}
          splitCount={0}
          workoutNames={workoutNames}
          currentOrder={null}
          onSave={saveSplitOrder}
          onClose={() => setIsOrderModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {splitConfig.split_count}분할 운동
          </p>
          <button
            onClick={handleChangeSplitCount}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            분할 수 변경
          </button>
        </div>
        <div
          onClick={handleEdit}
          className="cursor-pointer  grid grid-cols-4 gap-2 space-y-1 transition-colors hover:opacity-80"
        >
          {splitConfig.split_order.map((workout, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                {index + 1}
              </span>
              <span>{workout}</span>
            </div>
          ))}
        </div>
      </div>
      <SplitCountModal
        isOpen={isCountModalOpen}
        currentCount={splitConfig.split_count}
        onSave={saveSplitCount}
        onClose={() => setIsCountModalOpen(false)}
      />
      <SplitOrderModal
        isOpen={isOrderModalOpen}
        splitCount={splitConfig.split_count}
        workoutNames={workoutNames}
        currentOrder={splitConfig.split_order}
        onSave={saveSplitOrder}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </>
  );
}
