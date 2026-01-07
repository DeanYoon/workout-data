"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { WorkoutHistoryCard } from "./components/WorkoutHistoryCard";
import { ActiveSessionDrawer } from "./components/ActiveSessionDrawer";

// Dummy data
const HISTORY_DATA = [
  { id: 1, date: "Today", duration: "45m", totalWeight: 1250, workoutName: "Push Day" },
  { id: 2, date: "Yesterday", duration: "60m", totalWeight: 3400, workoutName: "Leg Day" },
  { id: 3, date: "Jan 5", duration: "50m", totalWeight: 1800, workoutName: "Pull Day" },
  { id: 4, date: "Jan 3", duration: "40m", totalWeight: 900, workoutName: "Arms & Abs" },
  { id: 5, date: "Jan 1", duration: "55m", totalWeight: 2100, workoutName: "Full Body" },
];

export default function WorkoutPage() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  return (
    <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
      {/* Sticky Start Button Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Workout</h1>
        <button
          onClick={() => setIsWorkoutActive(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="h-5 w-5 fill-current" />
          Start Workout
        </button>
      </div>

      {/* History Grid */}
      <div className="p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 uppercase tracking-wider">Recent History</h2>
        <div className="grid grid-cols-2 gap-3">
          {HISTORY_DATA.map((workout) => (
            <WorkoutHistoryCard
              key={workout.id}
              date={workout.date}
              duration={workout.duration}
              totalWeight={workout.totalWeight}
              workoutName={workout.workoutName}
            />
          ))}
        </div>
      </div>

      {/* Active Session Drawer */}
      <ActiveSessionDrawer
        isOpen={isWorkoutActive}
        onClose={() => setIsWorkoutActive(false)}
      />
    </div>
  );
}
