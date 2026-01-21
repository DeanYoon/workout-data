import { supabase } from '@/lib/supabase';

/**
 * Fetch weekly goal for a user
 */
export async function getWeeklyGoal(userId: string): Promise<number | null> {
    const { data, error } = await supabase
        .from('weekly_goals')
        .select('weekly_target')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data?.weekly_target ?? null;
}

/**
 * Save weekly goal for a user
 */
export async function saveWeeklyGoal(userId: string, goal: number): Promise<void> {
    const { error } = await supabase
        .from('weekly_goals')
        .upsert(
            { user_id: userId, weekly_target: goal },
            { onConflict: 'user_id' }
        );

    if (error) throw error;
}

/**
 * Fetch split config for a user
 */
export async function getSplitConfig(userId: string) {
    const { data, error } = await supabase
        .from('split_config')
        .select('split_count, split_order')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data
        ? {
            split_count: data.split_count,
            split_order: (data.split_order as string[]) ?? [],
        }
        : null;
}

/**
 * Save split count for a user
 */
export async function saveSplitCount(userId: string, count: number): Promise<void> {
    const { error } = await supabase
        .from('split_config')
        .upsert(
            { user_id: userId, split_count: count, split_order: [] },
            { onConflict: 'user_id' }
        );

    if (error) throw error;
}

/**
 * Save split order for a user
 */
export async function saveSplitOrder(userId: string, order: string[]): Promise<number> {
    const { data: currentConfig, error: fetchError } = await supabase
        .from('split_config')
        .select('split_count')
        .eq('user_id', userId)
        .single();

    if (fetchError || !currentConfig) {
        throw new Error('분할 수를 먼저 설정해주세요.');
    }

    const { error } = await supabase
        .from('split_config')
        .upsert(
            { user_id: userId, split_count: currentConfig.split_count, split_order: order },
            { onConflict: 'user_id' }
        );

    if (error) throw error;
    return currentConfig.split_count;
}

/** 홈/주간 스케줄·오늘 기록용 워크아웃 요약 */
export interface WorkoutSummary {
    id: string;
    start_time: string;
    end_time: string | null;
    name: string | null;
    total_weight: number;
    total_sets: number;
}

/**
 * Fetch all workouts (id, start_time, end_time, name, total_weight, total_sets) for a user
 */
export async function getAllWorkouts(userId: string): Promise<WorkoutSummary[]> {
    const { data, error } = await supabase
        .from('workouts')
        .select('id, start_time, end_time, name, total_weight, total_sets')
        .eq('user_id', userId)
        .eq('is_disabled', false)
        .order('start_time', { ascending: false });

    if (error) throw error;
    return data ?? [];
}



