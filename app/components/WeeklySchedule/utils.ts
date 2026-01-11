export const getWeekDays = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push(date);
  }
  return days;
};

export const getDayLabel = (date: Date) => {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return dayNames[date.getDay()];
};

export const getWorkoutNameShort = (name: string | null): string | null => {
  if (!name) return null;
  return name.length >= 2 ? name.substring(0, 2) : name;
};

export const getWorkoutForDate = (
  date: Date,
  allWorkoutsMap: Map<string, string>,
  splitOrder: string[],
  allWorkouts: Array<{ start_time: string; name: string | null }>
): { hasWorkout: boolean; workoutName: string | null; scheduledWorkout: string | null } => {
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const hasWorkout = allWorkoutsMap.has(dateKey);
  const workoutName = hasWorkout ? allWorkoutsMap.get(dateKey) || null : null;

  // Calculate scheduled workout based on split order
  let scheduledWorkout: string | null = null;
  if (!hasWorkout && splitOrder.length > 0) {
    // Find the last completed workout before this date
    let lastWorkoutIndex = -1;
    let lastWorkoutDate: Date | null = null;

    allWorkouts.forEach((workout) => {
      const workoutDate = new Date(workout.start_time);
      if (workoutDate < date && workout.name) {
        const index = splitOrder.indexOf(workout.name);
        if (index !== -1 && (!lastWorkoutDate || workoutDate > lastWorkoutDate)) {
          lastWorkoutIndex = index;
          lastWorkoutDate = workoutDate;
        }
      }
    });

    // Calculate days since last workout
    let daysSinceLastWorkout = 0;
    if (lastWorkoutDate) {
      const lastDate: Date = lastWorkoutDate;
      const diffTime = date.getTime() - lastDate.getTime();
      daysSinceLastWorkout = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate the workout index
    const workoutIndex = lastWorkoutIndex === -1
      ? daysSinceLastWorkout % splitOrder.length
      : (lastWorkoutIndex + daysSinceLastWorkout) % splitOrder.length;
    scheduledWorkout = splitOrder[workoutIndex];
  }

  return { hasWorkout, workoutName, scheduledWorkout };
};
