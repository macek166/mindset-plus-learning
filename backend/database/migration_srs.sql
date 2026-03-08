-- Migration for Spaced Repetition System (SRS)

-- 1. Add repetition level tracking
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS repetition_level INT DEFAULT 0;

-- 2. Add last score tracking (useful for regression logic)
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS last_test_score INT DEFAULT NULL;

-- 3. Add column for recursive remedial tracking (if needed, otherwise we rely on parent_node_id and depth_level > 1)
-- (No schema change needed for remedial structure, as we use parent_node_id + depth_level logic)

-- 4. Comment on Logic:
-- Level 0: Blue (Learning)
-- Level 1: Purple (Review in 24h)
-- Level 2: Yellow (Review in 4 days)
-- Level 3: Green (Review in 7 days)
-- Level 4: Fully Mastered (Green + Check)
