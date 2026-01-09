-- Create split_config table to store user's workout split configuration
CREATE TABLE IF NOT EXISTS split_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  split_count INTEGER NOT NULL CHECK (split_count >= 1 AND split_count <= 7),
  split_order JSONB NOT NULL, -- Array of workout names in order: ["상체", "하체", "유산소"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_split_config_user_id ON split_config(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_split_config_updated_at
  BEFORE UPDATE ON split_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
