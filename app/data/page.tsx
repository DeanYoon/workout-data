'use client';

import { useState, useMemo } from 'react';
import { useWorkoutAnalytics, DateAnalytics } from '@/hooks/useWorkoutAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChevronDown } from 'lucide-react';

type MetricType = 'maxWeight' | 'totalVolume' | 'totalSets';

const METRIC_LABELS: Record<MetricType, string> = {
  maxWeight: 'Max Weight',
  totalVolume: 'Total Volume',
  totalSets: 'Total Sets',
};

export default function DataPage() {
  const { data, isLoading, error } = useWorkoutAnalytics();
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('maxWeight');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get available exercises and find the most recent one
  const availableExercises = useMemo(() => {
    return Object.keys(data).sort();
  }, [data]);

  const mostRecentExercise = useMemo(() => {
    if (availableExercises.length === 0) return '';
    
    let mostRecent = availableExercises[0];
    let mostRecentDate = '';

    availableExercises.forEach((exercise) => {
      const exerciseData = data[exercise];
      if (exerciseData.length > 0) {
        const lastDate = exerciseData[exerciseData.length - 1].date;
        if (!mostRecentDate || lastDate > mostRecentDate) {
          mostRecentDate = lastDate;
          mostRecent = exercise;
        }
      }
    });

    return mostRecent;
  }, [data, availableExercises]);

  // Set default exercise when data loads
  useMemo(() => {
    if (mostRecentExercise && !selectedExercise) {
      setSelectedExercise(mostRecentExercise);
    }
  }, [mostRecentExercise, selectedExercise]);

  // Get chart data for selected exercise and metric
  const chartData = useMemo(() => {
    if (!selectedExercise || !data[selectedExercise]) return [];

    return data[selectedExercise].map((entry: DateAnalytics) => ({
      date: entry.date,
      value: entry[selectedMetric],
      formattedDate: format(parseISO(entry.date), 'MM/dd'),
    }));
  }, [selectedExercise, selectedMetric, data]);

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Data</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Data</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">Error loading analytics: {error.message}</p>
        </div>
      </div>
    );
  }

  if (availableExercises.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Data</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-zinc-500">No workout data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
      <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Data</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Exercise Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Exercise
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>{selectedExercise || 'Select exercise'}</span>
              <ChevronDown
                className={`h-5 w-5 text-zinc-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full mt-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg max-h-60 overflow-auto">
                  {availableExercises.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                        selectedExercise === exercise
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                          : ''
                      }`}
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metric Selector */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Metric
          </label>
          <div className="flex gap-2">
            {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`flex-1 rounded-xl px-4 py-3 font-medium transition-colors ${
                  selectedMetric === metric
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {METRIC_LABELS[metric]}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-zinc-500">No data available for selected exercise.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#71717a"
                  className="text-xs"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                />
                <YAxis
                  stroke="#71717a"
                  className="text-xs"
                  tick={{ fill: '#71717a', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e4e4e7',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#18181b', fontWeight: 600 }}
                  formatter={(value: number) => {
                    if (selectedMetric === 'totalVolume') {
                      return `${value.toLocaleString()} kg`;
                    }
                    if (selectedMetric === 'maxWeight') {
                      return `${value} kg`;
                    }
                    return value;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
