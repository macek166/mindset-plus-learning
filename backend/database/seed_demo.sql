-- Demo Seed Script for MindLoop MVP
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- 1. Create a demo user profile
-- Note: This assumes you have a user in auth.users table
-- If not, you'll need to sign up through Supabase Auth UI first
-- For demo purposes, we'll use a placeholder UUID

-- Insert demo profile (replace with your actual user ID from auth.users)
INSERT INTO profiles (id, email, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'demo@mindloop.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create a demo goal
INSERT INTO goals (id, user_id, title, type, created_at) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Master React Hooks', 'SKILL', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Create a learning path (nodes in sequence)
INSERT INTO nodes (id, goal_id, parent_node_id, title, content_md, kpis, status, depth_level, created_at) VALUES
-- Node 1: Foundation (DONE - user completed this)
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    NULL,
    'useState Basics',
    E'# useState Hook\n\n## What is useState?\n\n`useState` is a React Hook that lets you add state to functional components.\n\n```javascript\nconst [count, setCount] = useState(0);\n```\n\n## Key Concepts\n\n- **State Variable**: `count` holds the current value\n- **Setter Function**: `setCount` updates the value\n- **Initial Value**: `0` is the default state\n\n## Example\n\n```javascript\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Clicked {count} times\n    </button>\n  );\n}\n```',
    '[
        {"id": "kpi_1", "description": "Understand useState syntax and parameters", "importance": "essential"},
        {"id": "kpi_2", "description": "Explain state immutability", "importance": "essential"},
        {"id": "kpi_3", "description": "Use functional updates when state depends on previous value", "importance": "nice_to_have"}
    ]'::jsonb,
    'DONE',
    1,
    NOW()
),

-- Node 2: Intermediate (OPEN - currently available)
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'useEffect Dependencies',
    E'# useEffect Hook\n\n## Understanding Dependencies\n\nThe dependency array controls when your effect runs:\n\n```javascript\nuseEffect(() => {\n  console.log(\"Effect ran!\");\n}, [dependency]); // Runs when dependency changes\n```\n\n## Three Patterns\n\n### 1. No Dependencies (runs every render)\n```javascript\nuseEffect(() => {\n  console.log(\"Runs on every render\");\n});\n```\n\n### 2. Empty Dependencies (runs once)\n```javascript\nuseEffect(() => {\n  console.log(\"Runs only on mount\");\n}, []);\n```\n\n### 3. With Dependencies (runs when deps change)\n```javascript\nuseEffect(() => {\n  fetchData(userId);\n}, [userId]);\n```\n\n## Common Pitfall: Missing Dependencies\n\n⚠️ Always include all values from component scope that change over time!',
    '[
        {"id": "kpi_1", "description": "Explain the three dependency array patterns", "importance": "essential"},
        {"id": "kpi_2", "description": "Identify when to use each pattern", "importance": "essential"},
        {"id": "kpi_3", "description": "Understand the consequences of missing dependencies", "importance": "essential"}
    ]'::jsonb,
    'OPEN',
    1,
    NOW()
),

-- Node 3: Advanced (LOCKED - not yet available)
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'useReducer for Complex State',
    E'# useReducer Hook\n\n## When to Use useReducer\n\nUse `useReducer` when:\n- State logic is complex\n- Next state depends on previous state\n- You want to centralize state update logic\n\n## Basic Pattern\n\n```javascript\nconst [state, dispatch] = useReducer(reducer, initialState);\n\nfunction reducer(state, action) {\n  switch (action.type) {\n    case \"increment\":\n      return { count: state.count + 1 };\n    case \"decrement\":\n      return { count: state.count - 1 };\n    default:\n      return state;\n  }\n}\n```\n\n## Real-World Example\n\n```javascript\nfunction TodoList() {\n  const [todos, dispatch] = useReducer(todoReducer, []);\n  \n  const addTodo = (text) => {\n    dispatch({ type: \"ADD_TODO\", payload: text });\n  };\n  \n  return (/* ... */);\n}\n```',
    '[
        {"id": "kpi_1", "description": "Understand when useReducer is better than useState", "importance": "essential"},
        {"id": "kpi_2", "description": "Implement a reducer function with multiple action types", "importance": "essential"},
        {"id": "kpi_3", "description": "Use dispatch to trigger state updates", "importance": "essential"}
    ]'::jsonb,
    'LOCKED',
    1,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create a sample test attempt (shows the user tried Node 1 and passed)
INSERT INTO test_attempts (id, node_id, user_id, user_text, ai_feedback, passed, score, created_at) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'useState is a React Hook that allows functional components to have state. You call it with an initial value and it returns an array with the current state and a setter function. The setter updates the state and triggers a re-render.',
    '{
        "passed": true,
        "score": 85,
        "feedback": "Great explanation! You covered the core mechanics of useState.",
        "missed_kpi_ids": [],
        "semantic_embedding_text": "User demonstrates solid understanding of useState basics"
    }'::jsonb,
    true,
    85,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verification Queries (run these to check if data was inserted)
-- SELECT * FROM profiles;
-- SELECT * FROM goals;
-- SELECT * FROM nodes ORDER BY created_at;
-- SELECT * FROM test_attempts;
