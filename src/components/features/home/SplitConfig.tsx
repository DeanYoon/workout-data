"use client";

import { useState, useEffect } from "react";
import { SplitCountModal } from "./SplitCountModal";
import { SplitOrderModal } from "./SplitOrderModal";
import { useUserStore } from "@/stores";
import { saveSplitCount as saveSplitCountService, saveSplitOrder as saveSplitOrderService } from "@/services";
import { t } from "i18next";

interface SplitConfigData {
  split_count: number;
  split_order: string[];
}

interface SplitConfigProps {
  splitConfig: SplitConfigData | null;
  workoutNames: string[];
  onDataChange?: () => void;
}

export function SplitConfig({ splitConfig: initialSplitConfig, workoutNames: initialWorkoutNames, onDataChange }: SplitConfigProps) {
  const [splitConfig, setSplitConfig] = useState<SplitConfigData | null>(initialSplitConfig);
  const [workoutNames, setWorkoutNames] = useState<string[]>(initialWorkoutNames);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    setSplitConfig(initialSplitConfig);
    setWorkoutNames(initialWorkoutNames);
  }, [initialSplitConfig, initialWorkoutNames]);

  const saveSplitCount = async (count: number) => {
    try {
      const userId = await useUserStore.getState().getUserId();
      await saveSplitCountService(userId, count);

      setSplitConfig({ split_count: count, split_order: [] });
      setIsCountModalOpen(false);
      setIsOrderModalOpen(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('homeDataChanged'));
      }
    } catch (error) {
      console.error("Error saving split count:", error);
      alert(t('home.split.saveCountError'));
      throw error;
    }
  };

  const saveSplitOrder = async (order: string[]) => {
    try {
      const userId = await useUserStore.getState().getUserId();
      const splitCount = await saveSplitOrderService(userId, order);

      setSplitConfig({ split_count: splitCount, split_order: order });
      setIsOrderModalOpen(false);

      if (onDataChange) {
        onDataChange();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('homeDataChanged'));
      }
    } catch (error) {
      console.error("Error saving split order:", error);
      alert("분할 순서 저장에 실패했습니다");
      throw error;
    }
  };

  useEffect(() => {
    // If no config exists, show count modal on mount
    if (!splitConfig && !isCountModalOpen && !isOrderModalOpen) {
      setIsCountModalOpen(true);
    }
  }, [splitConfig, isCountModalOpen, isOrderModalOpen]);

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
            {t('home.split.setPrompt')}
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
            {t('home.split.splitCount', { count: splitConfig.split_count })}
          </p>
          <button
            onClick={handleChangeSplitCount}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('home.split.changeSplit')}
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
              <span>
                {workout.length > 5 ? workout.slice(0, 5) + ".." : workout}
              </span>
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



