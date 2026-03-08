-- Migration for Knowledge Base (Saved Concepts)

-- 1. Create Enum for Concept Categories
DO $$ BEGIN
    CREATE TYPE concept_category AS ENUM ('TERM', 'PERSON', 'THEORY', 'SKILL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create saved_concepts table
CREATE TABLE IF NOT EXISTS saved_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  node_id UUID REFERENCES nodes(id) ON DELETE SET NULL, -- keeps concept even if node deleted? or delete cascade? SET NULL is safer for KB
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category concept_category NOT NULL DEFAULT 'TERM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE saved_concepts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view own concepts" ON saved_concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts" ON saved_concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own concepts" ON saved_concepts
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Add index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_saved_concepts_user_id ON saved_concepts(user_id);
