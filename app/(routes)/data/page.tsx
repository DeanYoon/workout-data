'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkoutAnalyticsStore, useExerciseHistoryStore, type DateAnalytics } from '@/stores';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { format, parseISO } from '@/utils';
import { ChevronDown } from 'lucide-react';

type MetricType = 'maxWeight' | 'maxVolume' | 'totalVolume';
type ViewType = 'chart' | 'history';

export default function DataPage() {
  const { t } = useTranslation();

  const METRIC_LABELS: Record<MetricType, string> = {
    maxWeight: t('data.maxWeight'),
    maxVolume: t('data.maxVolume'),
    totalVolume: t('data.totalVolume'),
  };
  const { data, isLoading, error, isLoaded, fetchAnalytics } = useWorkoutAnalyticsStore();
  const { exerciseHistory, isLoading: isHistoryLoading, fetchExerciseHistory, clearHistory } = useExerciseHistoryStore();

  useEffect(() => {
    // Only fetch if not already loaded
    if (!isLoaded) {
      fetchAnalytics();
    }
  }, [isLoaded, fetchAnalytics]);

  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('maxWeight');
  const [viewType, setViewType] = useState<ViewType>('chart');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch exercise history when exercise is selected and view is history
  useEffect(() => {
    if (selectedExercise && viewType === 'history') {
      fetchExerciseHistory(selectedExercise);
    }
    // Don't clear history when switching to chart view - keep it cached
  }, [selectedExercise, viewType, fetchExerciseHistory]);

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

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!selectedExercise || !data[selectedExercise] || data[selectedExercise].length === 0) {
      return { personalBest: 0, totalRecords: 0 };
    }

    const exerciseData = data[selectedExercise];
    const personalBest = Math.max(...exerciseData.map((entry) => entry.maxWeight));
    const totalRecords = exerciseData.length;

    return { personalBest, totalRecords };
  }, [selectedExercise, data]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
        <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80 z-50">
          <h1 className=" text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('data.title')}</h1>
        </div>
        <div className="p-4 space-y-4">
          {/* Exercise Selector Skeleton */}
          <div>
            <div className="h-4 w-16 bg-zinc-200 rounded mb-2 animate-pulse dark:bg-zinc-800"></div>
            <div className="h-12 w-full bg-zinc-200 rounded-xl animate-pulse dark:bg-zinc-800"></div>
          </div>
          {/* Metric Selector Skeleton */}
          <div>
            <div className="h-4 w-16 bg-zinc-200 rounded mb-2 animate-pulse dark:bg-zinc-800"></div>
            <div className="flex gap-2">
              <div className="flex-1 h-12 bg-zinc-200 rounded-xl animate-pulse dark:bg-zinc-800"></div>
              <div className="flex-1 h-12 bg-zinc-200 rounded-xl animate-pulse dark:bg-zinc-800"></div>
              <div className="flex-1 h-12 bg-zinc-200 rounded-xl animate-pulse dark:bg-zinc-800"></div>
            </div>
          </div>
          {/* Chart Skeleton */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <div className="h-[300px] bg-zinc-200 rounded animate-pulse dark:bg-zinc-800"></div>
          </div>
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <div className="h-4 w-20 bg-zinc-200 rounded mb-2 animate-pulse dark:bg-zinc-800"></div>
              <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse dark:bg-zinc-800"></div>
            </div>
            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <div className="h-4 w-20 bg-zinc-200 rounded mb-2 animate-pulse dark:bg-zinc-800"></div>
              <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse dark:bg-zinc-800"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">{t('data.title')}</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-red-500">{t('data.loadError', { message: error.message })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 pb-24 dark:bg-black">
      <div className="sticky top-0 z-10 border-b bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80 z-50">
        <h1 className=" text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t('data.title')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Exercise Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t('data.exercise')}
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl bg-white text-zinc-900 dark:text-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-left font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>
                {availableExercises.length === 0
                  ? t('data.noExercises')
                  : selectedExercise || t('data.selectExercise')}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
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
                  {availableExercises.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {t('data.noExercises')}
                    </div>
                  ) : availableExercises.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${selectedExercise === exercise
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

        {/* View Type Tabs */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t('data.view')}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('chart')}
              className={`flex-1 rounded-xl px-4 py-3 font-medium transition-colors ${viewType === 'chart'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
            >
              {t('data.chart')}
            </button>
            <button
              onClick={() => setViewType('history')}
              className={`flex-1 rounded-xl px-4 py-3 font-medium transition-colors ${viewType === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
            >
              {t('data.history')}
            </button>
          </div>
        </div>

        {/* Metric Selector - Only show in chart view */}
        {viewType === 'chart' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t('data.metric')}
            </label>
            <div className="flex gap-2">
              {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`flex-1 rounded-xl px-4 py-3 font-medium transition-colors ${selectedMetric === metric
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                >
                  {METRIC_LABELS[metric]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chart or History Table */}
        {viewType === 'chart' ? (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">{t('data.noChartData')}</p>
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
                    domain={['auto', 'auto']}
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
                    formatter={(value: number | undefined) => {
                      if (value === undefined) return '';
                      if (selectedMetric === 'totalVolume') {
                        return `${value.toLocaleString()} kg`;
                      }
                      if (selectedMetric === 'maxWeight' || selectedMetric === 'maxVolume') {
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
        ) : (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
            {isHistoryLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">이력을 불러오는 중...</p>
              </div>
            ) : exerciseHistory.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">{t('data.noHistoryData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 dark:border-zinc-700">
                      <th className="text-center py-3 px-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                        {t('data.set')}
                      </th>
                      {exerciseHistory.slice().reverse().map((workout, index) => (
                        <th
                          key={workout.workoutId}
                          className="text-center py-3 px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 min-w-[100px] bg-zinc-50 dark:bg-zinc-800/50"
                        >
                          <div className="font-bold">{t('data.timesAgo', { n: exerciseHistory.length - index })}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                            {format(parseISO(workout.workoutDate), 'MM/dd')}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Find max number of sets across all workouts
                      const maxSets = Math.max(...exerciseHistory.map(w => w.sets.length));
                      const rows = [];

                      // Add set rows
                      for (let setIndex = 0; setIndex < maxSets; setIndex++) {
                        rows.push(
                          <tr
                            key={setIndex}
                            className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="py-3 px-3 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-800">
                              {setIndex + 1}
                            </td>
                            {exerciseHistory.slice().reverse().map((workout) => {
                              const set = workout.sets[setIndex];
                              return (
                                <td
                                  key={workout.workoutId}
                                  className="py-3 px-1 text-center text-sm"
                                >
                                  {set ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                        {set.weight}kg
                                      </div>
                                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                        × {set.reps}회
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 dark:text-zinc-600">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }

                      // Add total volume row
                      rows.push(
                        <tr
                          key="total"
                          className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
                        >
                          <td className="py-3 px-3 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100 sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-800">
                            {t('data.totalKilos')}
                          </td>
                          {exerciseHistory.slice().reverse().map((workout) => {
                            // Calculate total volume for this workout
                            const totalVolume = workout.sets.reduce((sum, set) => {
                              return sum + (set.weight * set.reps);
                            }, 0);
                            return (
                              <td
                                key={workout.workoutId}
                                className="py-3 px-1 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100"
                              >
                                {totalVolume.toLocaleString()}kg
                              </td>
                            );
                          })}
                        </tr>
                      );

                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats - Only show in chart view */}
        {viewType === 'chart' && (
          <div className="grid grid-cols-2 gap-3">
            {/* Personal Best Card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {t('data.personalBest')}
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {summaryStats.personalBest} <span className="text-base font-normal text-zinc-500">kg</span>
              </p>
            </div>

            {/* Total Records Card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {t('data.totalRecords')}
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {summaryStats.totalRecords} <span className="text-base font-normal text-zinc-500">{t('data.days')}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



