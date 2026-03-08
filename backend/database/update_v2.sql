-- update_v2.sql
-- Mindset+ 2.0 Schema Updates

-- 1. Concepts Table for Knowledge Tracking
CREATE TABLE IF NOT EXISTS concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    definition TEXT,
    status TEXT CHECK (status IN ('DISCOVERED', 'MASTERED')) DEFAULT 'DISCOVERED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own concepts" 
ON concepts FOR SELECT 
USING (
    goal_id IN (
        SELECT id FROM goals WHERE user_id = auth.uid() OR user_id = '822e5a23-0f00-4df3-a84e-dea4a5153b99' -- Allow demo user
    )
);

CREATE POLICY "Users can insert their own concepts" 
ON concepts FOR INSERT 
WITH CHECK (
    goal_id IN (
        SELECT id FROM goals WHERE user_id = auth.uid() OR user_id = '822e5a23-0f00-4df3-a84e-dea4a5153b99'
    )
);

CREATE POLICY "Users can update their own concepts" 
ON concepts FOR UPDATE 
USING (
    goal_id IN (
        SELECT id FROM goals WHERE user_id = auth.uid() OR user_id = '822e5a23-0f00-4df3-a84e-dea4a5153b99'
    )
);
