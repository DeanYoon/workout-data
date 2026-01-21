export interface DaySchedule {
    date: Date;
    dayLabel: string;
    isToday: boolean;
    hasWorkout: boolean;
    workoutName: string | null;
    workoutNameShort: string | null;
    isPast: boolean;
    isFuture: boolean;
}

export interface WeeklyScheduleProps {
    splitOrder: string[];
    weekWorkouts: Array<{ start_time: string; name: string | null }>;
    allWorkouts: Array<{ start_time: string; name: string | null }>;
}



