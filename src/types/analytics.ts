export interface DateAnalytics {
  date: string; // YYYY-MM-DD format
  maxWeight: number;
  maxVolume: number;
  totalVolume: number;
}

export interface WorkoutAnalyticsData {
  [exerciseName: string]: DateAnalytics[];
}

export interface ExerciseSetHistory {
  workoutId: string;
  workoutDate: string;
  setOrder: number;
  weight: number;
  reps: number;
}

export interface ExerciseHistoryByWorkout {
  workoutId: string;
  workoutDate: string;
  sets: Array<{
    order: number;
    weight: number;
    reps: number;
  }>;
}



