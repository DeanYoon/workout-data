import { supabase } from '@/lib/supabase';
import { UserProfile, WeightRecord } from '@/types/profile';

/**
 * Fetch user profile
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
}

/**
 * Update or create user profile
 */
export async function upsertProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existingProfile) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Fetch weight records for a user
 */
export async function getWeightRecords(
  userId: string,
  limit: number = 100
): Promise<WeightRecord[]> {
  const { data, error } = await supabase
    .from('weight_records')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Add or update weight record for a specific date
 */
export async function addWeightRecord(
  userId: string,
  weight: number,
  recordedAt?: string
): Promise<WeightRecord> {
  const recordDate = recordedAt || new Date().toISOString();
  const recordDateTime = new Date(recordDate);
  const dateOnly = recordDateTime.toISOString().split('T')[0];

  const startOfDay = `${dateOnly}T00:00:00.000Z`;
  const endOfDay = `${dateOnly}T23:59:59.999Z`;

  // Find existing records for the same date
  const { data: existingRecords, error: checkError } = await supabase
    .from('weight_records')
    .select('id')
    .eq('user_id', userId)
    .gte('recorded_at', startOfDay)
    .lte('recorded_at', endOfDay);

  if (checkError) throw checkError;

  // Delete existing records for the same date
  if (existingRecords && existingRecords.length > 0) {
    const recordIds = existingRecords.map((r) => r.id);
    const { error: deleteError } = await supabase
      .from('weight_records')
      .delete()
      .in('id', recordIds);

    if (deleteError) throw deleteError;
  }

  // Insert new record
  const { data, error } = await supabase
    .from('weight_records')
    .insert({
      user_id: userId,
      weight,
      recorded_at: recordDate,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}



