export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeightRecord {
  id: string;
  user_id: string;
  weight: number;
  recorded_at: string;
  created_at: string;
}



