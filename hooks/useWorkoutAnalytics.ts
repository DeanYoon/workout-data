import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface ExerciseAnalytics {
  exerciseName: string;
  data: DateAnalytics[];
}

export interface DateAnalytics {
  date: string; // YYYY-MM-DD format
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
}

export interface WorkoutAnalyticsData {
  [exerciseName: string]: DateAnalytics[];
}

interface SetWithRelations {
  id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  is_completed: boolean;
  order: number;
  exercises: {
    name: string;
    workouts: {
      start_time: string;
    };
  };
}

export function useWorkoutAnalytics() {
  const [data, setData] = useState<WorkoutAnalyticsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch sets with exercises and workouts join
        const { data: setsData, error: fetchError } = await supabase
          .from('sets')
          .select(`
            *,
            exercises (
              name,
              workouts (
                start_time
              )
            )
          `)
          .eq('is_completed', true);

        if (fetchError) throw fetchError;

        if (!setsData) {
          setData({});
          return;
        }

        // Process and group data
        const analyticsMap: WorkoutAnalyticsData = {};

        (setsData as SetWithRelations[]).forEach((set) => {
          const exerciseName = set.exercises?.name;
          const workoutStartTime = set.exercises?.workouts?.start_time;

          if (!exerciseName || !workoutStartTime) return;

          // Extract date from start_time (YYYY-MM-DD)
          const date = format(new Date(workoutStartTime), 'yyyy-MM-dd');

          // Initialize exercise if not exists
          if (!analyticsMap[exerciseName]) {
            analyticsMap[exerciseName] = [];
          }

          // Find or create date entry
          let dateEntry = analyticsMap[exerciseName].find((entry) => entry.date === date);

          if (!dateEntry) {
            dateEntry = {
              date,
              maxWeight: 0,
              totalVolume: 0,
              totalSets: 0,
            };
            analyticsMap[exerciseName].push(dateEntry);
          }

          // Update metrics
          dateEntry.maxWeight = Math.max(dateEntry.maxWeight, set.weight);
          dateEntry.totalVolume += set.weight * set.reps;
          dateEntry.totalSets += 1;
        });

        // Sort dates for each exercise
        Object.keys(analyticsMap).forEach((exerciseName) => {
          analyticsMap[exerciseName].sort((a, b) => a.date.localeCompare(b.date));
        });

        setData(analyticsMap);
      } catch (err) {
        console.error('Error fetching workout analytics:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { data, isLoading, error };
}
