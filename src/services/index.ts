// Workout services
export {
  getWorkoutByName,
  getWorkoutById,
  getWorkoutsWithDetails,
  saveWorkout,
  deleteWorkout,
  getRecentWorkoutsWithExercises,
  getWorkoutForDate,
  getExerciseNames,
  type SaveWorkoutData,
} from './workout.service';

// Profile services
export {
  getProfile,
  upsertProfile,
  getWeightRecords,
  addWeightRecord,
} from './profile.service';

// Analytics services
export {
  getWorkoutAnalytics,
  getExerciseHistory,
  type AnalyticsRow,
} from './analytics.service';

// Home services
export {
  getWeeklyGoal,
  saveWeeklyGoal,
  getSplitConfig,
  saveSplitCount,
  saveSplitOrder,
  getAllWorkouts,
  type WorkoutSummary,
} from './home.service';



