-- Add updated_at column to sermon_participation table
ALTER TABLE sermon_participation 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger for automatically updating the updated_at timestamp
CREATE TRIGGER update_sermon_participation_updated_at 
    BEFORE UPDATE ON sermon_participation
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have an updated_at value
UPDATE sermon_participation 
SET updated_at = started_at 
WHERE updated_at IS NULL; 