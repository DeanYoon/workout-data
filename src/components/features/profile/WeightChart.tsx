'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays } from 'date-fns';
import { format, parseISO } from '@/utils';
import { WeightRecord } from '@/types/profile';

interface WeightChartProps {
    weightRecords: WeightRecord[];
}

export function WeightChart({ weightRecords }: WeightChartProps) {
    const { t } = useTranslation();
    const chartData = useMemo(() => {
        if (weightRecords.length === 0) return [];

        // Sort by date ascending for chart
        const sorted = [...weightRecords].sort((a, b) =>
            new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );

        // Get date range (last 30 days or all records if less than 30)
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);

        const filtered = sorted.filter(record => {
            const recordDate = new Date(record.recorded_at);
            return recordDate >= thirtyDaysAgo;
        });

        // If we have records, show them. Otherwise show empty chart message.
        return filtered.map(record => ({
            date: record.recorded_at,
            weight: parseFloat(record.weight.toString()),
            formattedDate: format(parseISO(record.recorded_at), 'MM/dd'),
        }));
    }, [weightRecords]);

    if (weightRecords.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">{t('profile.noWeightRecords')}</p>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">{t('profile.noWeightRecords30d')}</p>
            </div>
        );
    }

    // Calculate min and max for Y-axis with padding
    const weights = chartData.map(d => d.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const padding = (maxWeight - minWeight) * 0.1 || 1;
    const yAxisMin = Math.max(0, minWeight - padding);
    const yAxisMax = maxWeight + padding;

    return (
        <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#71717a"
                        className="text-xs"
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={[yAxisMin, yAxisMax]}
                        stroke="#71717a"
                        className="text-xs"
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        tickFormatter={(value) => value.toFixed(1)}
                        label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: '#71717a' }}
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
                            return [`${value.toFixed(1)} kg`, '몸무게'];
                        }}
                        labelFormatter={(label) => `날짜: ${label}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}



