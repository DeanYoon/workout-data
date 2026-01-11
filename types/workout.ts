export interface Workout {
  id: string;
  name: string; // Added name
  start_time: string;
  end_time: string | null;
  total_weight: number;
  total_sets: number;
  user_id: string;
  is_disabled?: boolean; // Soft delete flag
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  order: number;
}

export interface Set {
  id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  is_completed: boolean;
  order: number;
}

// Helper type for fetching nested data from Supabase
export interface WorkoutWithDetails extends Workout {
  exercises: (Exercise & {
    sets: Set[];
  })[];
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeightRecord {
  id: string;
  user_id: string;
  weight: number;
  recorded_at: string;
  created_at: string;
}
