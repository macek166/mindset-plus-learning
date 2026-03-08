-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create ENUM types
-- We wrap in DO block to prevent errors if they exist, or just rely on simple CREATE
DO $$ BEGIN
    CREATE TYPE goal_type AS ENUM ('SKILL', 'KNOWLEDGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE node_status AS ENUM ('LOCKED', 'OPEN', 'POTENTIAL', 'GOOD', 'DONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GOALS
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type goal_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NODES
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  parent_node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_md TEXT,
  kpis JSONB,
  status node_status DEFAULT 'LOCKED',
  next_review_at TIMESTAMPTZ,
  depth_level INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEST ATTEMPTS
-- Added user_id for easier RLS and direct ownership tracking
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  user_text TEXT NOT NULL,
  ai_feedback JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- GOALS
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- NODES
-- Access nodes through the goal ownership
CREATE POLICY "Users can view own nodes" ON nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = nodes.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own nodes" ON nodes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = nodes.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own nodes" ON nodes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = nodes.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own nodes" ON nodes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = nodes.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- TEST ATTEMPTS
CREATE POLICY "Users can view own attempts" ON test_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
