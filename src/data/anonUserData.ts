import { UserProfile, WeightRecord } from '@/types/profile';
import { WorkoutWithDetails } from '@/types/workout';
import type { WorkoutSummary } from '@/services/home.service';

// Generate dates for sample data
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
const weekAgo = new Date(today);
weekAgo.setDate(weekAgo.getDate() - 7);
const twoWeeksAgo = new Date(today);
twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

// Helper to create ISO strings
const toISO = (date: Date, hours: number = 10, minutes: number = 0) => {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const addHours = (date: Date, hours: number) => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

// Sample Profile Data
export const getAnonUserProfile = (): UserProfile => ({
  id: 'anon-profile-id',
  user_id: 'anon_user',
  name: 'Sample User',
  age: 28,
  gender: 'male',
  height: 175,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Sample Weight Records
export const getAnonUserWeightRecords = (): WeightRecord[] => {
  const records: WeightRecord[] = [];
  let weight = 75.5;
  
  // Generate weight records for the last 90 days (3 months)
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Record weight 2-3 times per week
    if (i % 3 === 0 || i % 4 === 0) {
      // Gradual weight loss trend over 3 months
      const trend = -0.05 * (i / 90); // Lose about 0.05kg per day on average
      weight = 75.5 + trend + (Math.random() - 0.5) * 0.4; // Small fluctuations
      
      records.push({
        id: `anon-weight-${i}`,
        user_id: 'anon_user',
        weight: Math.round(weight * 10) / 10,
        recorded_at: toISO(date, 8, 0),
        created_at: toISO(date, 8, 0),
      });
    }
  }
  
  return records.sort((a, b) => 
    new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
};

// Helper function to create a workout
const createWorkout = (
  id: string,
  name: string,
  date: Date,
  hour: number,
  exercises: Array<{
    name: string;
    sets: Array<{ weight: number; reps: number }>;
  }>
): WorkoutWithDetails => {
  let totalWeight = 0;
  let totalSets = 0;
  let exerciseIdCounter = 0;
  let setIdCounter = 0;

  const workoutExercises = exercises.map((ex, exIdx) => {
    const exerciseId = `anon-ex-${id}-${exerciseIdCounter++}`;
    const workoutSets = ex.sets.map((set, setIdx) => {
      totalWeight += set.weight * set.reps;
      totalSets++;
      return {
        id: `anon-set-${id}-${setIdCounter++}`,
        exercise_id: exerciseId,
        weight: set.weight,
        reps: set.reps,
        is_completed: true,
        order: setIdx,
      };
    });

    return {
      id: exerciseId,
      workout_id: `anon-workout-${id}`,
      name: ex.name,
      order: exIdx,
      sets: workoutSets,
    };
  });

  return {
    id: `anon-workout-${id}`,
    user_id: 'anon_user',
    name,
    start_time: toISO(date, hour, 0),
    end_time: addHours(new Date(toISO(date, hour, 0)), 1.5),
    total_weight: totalWeight,
    total_sets: totalSets,
    is_disabled: false,
    exercises: workoutExercises,
  };
};

// Sample Workouts - Generate 12 weeks (3 months) of data
export const getAnonUserWorkouts = (): WorkoutWithDetails[] => {
  const workouts: WorkoutWithDetails[] = [];
  const workoutNames = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders'];
  let workoutCounter = 1;

  // Generate workouts for the past 12 weeks (84 days)
  for (let week = 0; week < 12; week++) {
    // Calculate week start (Sunday of that week)
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekStart.setDate(weekStart.getDate() - (week * 7) - dayOfWeek);

    // 4 workouts per week (Mon, Wed, Fri, Sat pattern)
    // Monday=1, Wednesday=3, Friday=5, Saturday=6
    const workoutDays = [1, 3, 5, 6];
    
    workoutDays.forEach((targetDay, dayIdx) => {
      const workoutDate = new Date(weekStart);
      workoutDate.setDate(weekStart.getDate() + targetDay);
      
      // Skip if future date
      if (workoutDate > today) return;

      const workoutName = workoutNames[dayIdx % 4];
      // Reverse progress: week 0 (most recent) should have highest weight
      const weekProgress = (12 - week) / 12; // 1 to 0 (most recent = highest)
      const baseWeightMultiplier = 1 + (weekProgress * 0.15); // 15% increase from oldest to newest

      let workout: WorkoutWithDetails;

      if (workoutName === 'Chest & Triceps') {
        const benchWeight = Math.round(75 * baseWeightMultiplier);
        const inclineWeight = Math.round(28 * baseWeightMultiplier);
        const flyWeight = Math.round(23 * baseWeightMultiplier);
        const tricepsWeight = Math.round(38 * baseWeightMultiplier);

        workout = createWorkout(
          `${workoutCounter++}`,
          workoutName,
          workoutDate,
          10,
          [
            {
              name: 'Bench Press',
              sets: [
                { weight: benchWeight, reps: 8 },
                { weight: benchWeight, reps: 8 },
                { weight: benchWeight, reps: 6 },
              ],
            },
            {
              name: 'Incline Dumbbell Press',
              sets: [
                { weight: inclineWeight, reps: 10 },
                { weight: inclineWeight, reps: 10 },
                { weight: inclineWeight, reps: 8 },
              ],
            },
            {
              name: 'Cable Fly',
              sets: [
                { weight: flyWeight, reps: 12 },
                { weight: flyWeight, reps: 12 },
                { weight: flyWeight, reps: 10 },
              ],
            },
            {
              name: 'Triceps Pushdown',
              sets: [
                { weight: tricepsWeight, reps: 12 },
                { weight: tricepsWeight, reps: 12 },
                { weight: tricepsWeight, reps: 10 },
              ],
            },
          ]
        );
      } else if (workoutName === 'Back & Biceps') {
        const deadliftWeight = Math.round(115 * baseWeightMultiplier);
        const latWeight = Math.round(58 * baseWeightMultiplier);
        const rowWeight = Math.round(68 * baseWeightMultiplier);
        const curlWeight = Math.round(14 * baseWeightMultiplier);
        const hammerWeight = Math.round(11 * baseWeightMultiplier);

        workout = createWorkout(
          `${workoutCounter++}`,
          workoutName,
          workoutDate,
          19,
          [
            {
              name: 'Deadlift',
              sets: [
                { weight: deadliftWeight, reps: 5 },
                { weight: deadliftWeight, reps: 5 },
                { weight: deadliftWeight, reps: 5 },
              ],
            },
            {
              name: 'Lat Pulldown',
              sets: [
                { weight: latWeight, reps: 10 },
                { weight: latWeight, reps: 10 },
                { weight: latWeight, reps: 8 },
              ],
            },
            {
              name: 'Barbell Row',
              sets: [
                { weight: rowWeight, reps: 10 },
                { weight: rowWeight, reps: 10 },
                { weight: rowWeight, reps: 8 },
              ],
            },
            {
              name: 'Bicep Curl',
              sets: [
                { weight: curlWeight, reps: 12 },
                { weight: curlWeight, reps: 12 },
                { weight: curlWeight, reps: 10 },
              ],
            },
            {
              name: 'Hammer Curl',
              sets: [
                { weight: hammerWeight, reps: 12 },
                { weight: hammerWeight, reps: 12 },
                { weight: hammerWeight, reps: 10 },
              ],
            },
          ]
        );
      } else if (workoutName === 'Legs') {
        const squatWeight = Math.round(95 * baseWeightMultiplier);
        const legPressWeight = Math.round(145 * baseWeightMultiplier);
        const legCurlWeight = Math.round(48 * baseWeightMultiplier);
        const legExtWeight = Math.round(38 * baseWeightMultiplier);
        const calfWeight = Math.round(78 * baseWeightMultiplier);

        workout = createWorkout(
          `${workoutCounter++}`,
          workoutName,
          workoutDate,
          18,
          [
            {
              name: 'Squat',
              sets: [
                { weight: squatWeight, reps: 8 },
                { weight: squatWeight, reps: 8 },
                { weight: squatWeight, reps: 6 },
                { weight: squatWeight, reps: 6 },
              ],
            },
            {
              name: 'Leg Press',
              sets: [
                { weight: legPressWeight, reps: 12 },
                { weight: legPressWeight, reps: 12 },
                { weight: legPressWeight, reps: 10 },
              ],
            },
            {
              name: 'Leg Curl',
              sets: [
                { weight: legCurlWeight, reps: 12 },
                { weight: legCurlWeight, reps: 12 },
                { weight: legCurlWeight, reps: 10 },
              ],
            },
            {
              name: 'Leg Extension',
              sets: [
                { weight: legExtWeight, reps: 15 },
                { weight: legExtWeight, reps: 15 },
                { weight: legExtWeight, reps: 12 },
              ],
            },
            {
              name: 'Calf Raise',
              sets: [
                { weight: calfWeight, reps: 15 },
                { weight: calfWeight, reps: 15 },
                { weight: calfWeight, reps: 12 },
              ],
            },
          ]
        );
      } else { // Shoulders
        const overheadWeight = Math.round(48 * baseWeightMultiplier);
        const lateralWeight = Math.round(9 * baseWeightMultiplier);
        const frontWeight = Math.round(9 * baseWeightMultiplier);
        const rearWeight = Math.round(11 * baseWeightMultiplier);

        workout = createWorkout(
          `${workoutCounter++}`,
          workoutName,
          workoutDate,
          11,
          [
            {
              name: 'Overhead Press',
              sets: [
                { weight: overheadWeight, reps: 10 },
                { weight: overheadWeight, reps: 10 },
                { weight: overheadWeight, reps: 8 },
              ],
            },
            {
              name: 'Lateral Raise',
              sets: [
                { weight: lateralWeight, reps: 15 },
                { weight: lateralWeight, reps: 15 },
                { weight: lateralWeight, reps: 12 },
              ],
            },
            {
              name: 'Front Raise',
              sets: [
                { weight: frontWeight, reps: 12 },
                { weight: frontWeight, reps: 12 },
                { weight: frontWeight, reps: 10 },
              ],
            },
            {
              name: 'Rear Delt Fly',
              sets: [
                { weight: rearWeight, reps: 12 },
                { weight: rearWeight, reps: 12 },
                { weight: rearWeight, reps: 10 },
              ],
            },
          ]
        );
      }

      workouts.push(workout);
    });
  }

  // Sort by date (newest first)
  return workouts.sort((a, b) => 
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
};

// Helper to convert WorkoutWithDetails to WorkoutSummary
export const getAnonUserWorkoutSummaries = (): WorkoutSummary[] => {
  return getAnonUserWorkouts().map((w) => ({
    id: w.id,
    start_time: w.start_time,
    end_time: w.end_time,
    name: w.name,
    total_weight: w.total_weight,
    total_sets: w.total_sets,
  }));
};

// Weekly Goal
export const getAnonUserWeeklyGoal = (): number => 4;

// Split Config
export const getAnonUserSplitConfig = () => ({
  split_count: 4,
  split_order: ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders'],
});
