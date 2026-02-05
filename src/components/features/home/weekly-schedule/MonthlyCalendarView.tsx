"use client";

import { Check, X } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { formatMonthYear, formatShortWeekday } from "@/utils";
import type { DateLocale } from "@/utils";
import { getWorkoutForDate, getWorkoutNameShort } from "./utils";

interface MonthlyCalendarViewProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick: (date: Date) => void;
  allWorkoutsMap: Map<string, string>;
  splitOrder: string[];
  allWorkouts: Array<{ start_time: string; name: string | null }>;
  language: DateLocale;
}

export function MonthlyCalendarView({
  currentMonth,
  onMonthChange,
  onDateClick,
  allWorkoutsMap,
  splitOrder,
  allWorkouts,
  language,
}: MonthlyCalendarViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Custom tile content for calendar
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const workoutInfo = getWorkoutForDate(date, allWorkoutsMap, splitOrder, allWorkouts);
    const isPast = date < today;

    return (
      <div className="flex flex-col items-center gap-1 mt-1">
        {workoutInfo.hasWorkout ? (
          <>
            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500">
              <Check className="h-2.5 w-2.5 text-white" />
            </div>
            {workoutInfo.workoutName && (
              <span className="text-[9px] font-medium text-zinc-900 dark:text-zinc-100">
                {getWorkoutNameShort(workoutInfo.workoutName)}
              </span>
            )}
          </>
        ) : isPast ? (
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500">
            <X className="h-2.5 w-2.5 text-white" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-dashed border-zinc-400 dark:border-zinc-600" />
        )}
      </div>
    );
  };

  // Custom tile className
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const isToday = date.toDateString() === today.toDateString();
    const workoutInfo = getWorkoutForDate(date, allWorkoutsMap, splitOrder, allWorkouts);

    let className = '';
    if (isToday) {
      className += 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 ';
    }
    if (workoutInfo.hasWorkout) {
      className += 'font-semibold ';
    }

    return className.trim() || null;
  };

  return (
    <div className="flex flex-col items-center">
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          background: transparent;
          border: none;
          font-family: inherit;
        }
        .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 1em;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          font-weight: 600;
          color: rgb(39 39 42);
        }
        .dark .react-calendar__navigation button {
          color: rgb(244 244 245);
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: rgb(228 228 231);
        }
        .dark .react-calendar__navigation button:enabled:hover,
        .dark .react-calendar__navigation button:enabled:focus {
          background-color: rgb(39 39 42);
        }
        .react-calendar__navigation button[disabled] {
          background-color: transparent;
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75em;
          padding: 0.5em 0;
        }
        .react-calendar__month-view__weekdays__weekday {
          padding: 0.5em;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .react-calendar__tile {
          max-width: 100%;
          padding: 0.5em 0.25em;
          background: transparent;
          text-align: center;
          line-height: 14px;
          font-size: 0.75em;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          border-radius: 0.5rem;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: rgb(228 228 231);
        }
        .dark .react-calendar__tile:enabled:hover,
        .dark .react-calendar__tile:enabled:focus {
          background-color: rgb(39 39 42);
        }
        .react-calendar__tile--now {
          background: transparent;
        }
        .react-calendar__tile--active {
          background: transparent;
        }
        .react-calendar__tile--neighboringMonth {
          opacity: 0.15;
        }
        .react-calendar__tile--neighboringMonth abbr {
          color: rgb(161 161 170);
        }
        .dark .react-calendar__tile--neighboringMonth abbr {
          color: rgb(63 63 70);
        }
        .react-calendar__month-view__days__day--weekend {
          color: inherit;
        }
        .react-calendar__month-view__days__day--weekend abbr {
          color: inherit;
        }
        .react-calendar__month-view__days__day:nth-child(7n) abbr {
          color: inherit;
        }
      `}</style>
      <Calendar
        onChange={(value) => {
          if (value instanceof Date) {
            onMonthChange(value);
          } else if (Array.isArray(value) && value[0] instanceof Date) {
            onMonthChange(value[0]);
          }
        }}
        onClickDay={onDateClick}
        value={currentMonth}
        formatMonthYear={(_locale, date) => formatMonthYear(date, language)}
        formatShortWeekday={(_locale, date) => formatShortWeekday(date, language)}
        tileContent={tileContent}
        tileClassName={tileClassName}
        next2Label={null}
        prev2Label={null}
        showNeighboringMonth={true}
      />
    </div>
  );
}



