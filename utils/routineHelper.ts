import { Workout } from "@/types/workout";

export type DayStatus = "DONE" | "MISSED" | "PLANNED";

export interface DayInfo {
  date: Date;
  status: DayStatus;
  label: string;
}

export interface WeekStats {
  done: number;
  missed: number;
  total: number;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get all dates in the current week (Monday to Sunday)
 */
export function getWeekDates(date: Date = new Date()): Date[] {
  const weekStart = getWeekStart(date);
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  
  return dates;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is before today (not including today)
 */
export function isBeforeToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is after today
 */
export function isAfterToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate > today;
}

/**
 * Get workout for a specific date from workouts array
 */
function getWorkoutForDate(workouts: Workout[], date: Date): Workout | null {
  return workouts.find((w) => {
    const workoutDate = new Date(w.start_time);
    return isSameDay(workoutDate, date) && !w.is_disabled;
  }) || null;
}

/**
 * Find the last workout that was done (before or on a given date)
 */
function findLastWorkoutIndex(
  workouts: Workout[],
  splitNames: string[],
  beforeDate: Date
): number {
  // Filter workouts before or on the given date, sorted by date descending
  const relevantWorkouts = workouts
    .filter((w) => {
      const workoutDate = new Date(w.start_time);
      return workoutDate <= beforeDate && !w.is_disabled;
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  if (relevantWorkouts.length === 0) {
    return -1; // No previous workout found
  }

  // Find the index of the last workout's name in splitNames
  const lastWorkoutName = relevantWorkouts[0].name;
  const index = splitNames.findIndex((name) => name === lastWorkoutName);
  
  return index >= 0 ? index : -1;
}

/**
 * Calculate routine schedule for the current week
 */
export function calculateRoutineSchedule(
  weekDates: Date[],
  workouts: Workout[],
  splitNames: string[]
): { days: DayInfo[]; stats: WeekStats } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DayInfo[] = [];
  let doneCount = 0;
  let missedCount = 0;

  // Find the last workout index before today
  const lastWorkoutIndex = findLastWorkoutIndex(workouts, splitNames, today);

  // Calculate starting index for today (if no workout today)
  let currentIndex = lastWorkoutIndex >= 0 ? (lastWorkoutIndex + 1) % splitNames.length : 0;

  // Check if today has a workout
  const todayWorkout = getWorkoutForDate(workouts, today);
  if (todayWorkout) {
    const todayIndex = splitNames.findIndex((name) => name === todayWorkout.name);
    if (todayIndex >= 0) {
      currentIndex = (todayIndex + 1) % splitNames.length;
    }
  }

  for (let i = 0; i < weekDates.length; i++) {
    const date = weekDates[i];
    date.setHours(0, 0, 0, 0);
    
    const workout = getWorkoutForDate(workouts, date);
    const isPast = isBeforeToday(date);
    const isTodayDate = isToday(date);
    const isFuture = isAfterToday(date);

    if (workout) {
      // Has workout record
      days.push({
        date,
        status: "DONE",
        label: workout.name,
      });
      if (isPast || isTodayDate) {
        doneCount++;
      }
    } else if (isPast) {
      // Past date without workout = MISSED
      days.push({
        date,
        status: "MISSED",
        label: "X",
      });
      missedCount++;
    } else {
      // Future date or today without workout = PLANNED
      const plannedLabel = splitNames[currentIndex] || splitNames[0];
      days.push({
        date,
        status: "PLANNED",
        label: plannedLabel,
      });
      
      // Move to next split for next day
      currentIndex = (currentIndex + 1) % splitNames.length;
    }
  }

  return {
    days,
    stats: {
      done: doneCount,
      missed: missedCount,
      total: doneCount + missedCount,
    },
  };
}
