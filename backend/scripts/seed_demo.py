#!/usr/bin/env python3
"""
Demo Data Seeder for MindLoop
Alternative to SQL script - uses Python + Supabase client
"""

import asyncio
from datetime import datetime
from uuid import uuid4

# Add parent directory to path so we can import from app
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.database import db_service

# Demo User ID (you can replace this with your actual Supabase Auth user ID)
DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
DEMO_EMAIL = "demo@mindloop.com"

async def seed_demo_data():
    print("🌱 Seeding MindLoop with demo data...\n")
    
    # 1. Create Profile (if using Service Role Key, RLS is bypassed)
    print("1️⃣ Creating demo profile...")
    try:
        profile = db_service.client.table("profiles").insert({
            "id": DEMO_USER_ID,
            "email": DEMO_EMAIL,
            "created_at": datetime.now().isoformat()
        }).execute()
        print(f"   ✅ Profile created: {DEMO_EMAIL}")
    except Exception as e:
        print(f"   ⚠️  Profile might already exist: {e}")
    
    # 2. Create Goal
    print("\n2️⃣ Creating learning goal...")
    goal_id = await db_service.create_goal(
        user_id=DEMO_USER_ID,
        title="Master React Hooks",
        description="Learn useState, useEffect, useReducer, and custom hooks",
        type="SKILL"
    )
    print(f"   ✅ Goal created: {goal_id}")
    
    # 3. Create Curriculum Nodes
    print("\n3️⃣ Creating curriculum nodes...")
    
    nodes_data = [
        {
            "id": str(uuid4()),
            "goal_id": goal_id,
            "parent_node_id": None,
            "title": "useState Basics",
            "content_md": """# useState Hook

## What is useState?

`useState` is a React Hook that lets you add state to functional components.

```javascript
const [count, setCount] = useState(0);
```

## Key Concepts

- **State Variable**: `count` holds the current value
- **Setter Function**: `setCount` updates the value
- **Initial Value**: `0` is the default state
""",
            "kpis": [
                {"id": "kpi_1", "description": "Understand useState syntax", "importance": "essential"},
                {"id": "kpi_2", "description": "Explain state immutability", "importance": "essential"}
            ],
            "status": "DONE",
            "depth_level": 1
        }
    ]
    
    # First node
    node1_data = nodes_data[0]
    db_service.client.table("nodes").insert(node1_data).execute()
    print(f"   ✅ Node 1: {node1_data['title']} (DONE)")
    
    # Second node
    node2_data = {
        "id": str(uuid4()),
        "goal_id": goal_id,
        "parent_node_id": node1_data["id"],
        "title": "useEffect Dependencies",
        "content_md": """# useEffect Hook

## Understanding Dependencies

The dependency array controls when your effect runs.

```javascript
useEffect(() => {
  console.log("Effect ran!");
}, [dependency]);
```
""",
        "kpis": [
            {"id": "kpi_1", "description": "Explain dependency array patterns", "importance": "essential"}
        ],
        "status": "OPEN",
        "depth_level": 1
    }
    db_service.client.table("nodes").insert(node2_data).execute()
    print(f"   ✅ Node 2: {node2_data['title']} (OPEN)")
    
    # Third node
    node3_data = {
        "id": str(uuid4()),
        "goal_id": goal_id,
        "parent_node_id": node2_data["id"],
        "title": "useReducer for Complex State",
        "content_md": "# useReducer Hook\n\nAdvanced state management...",
        "kpis": [],
        "status": "LOCKED",
        "depth_level": 1
    }
    db_service.client.table("nodes").insert(node3_data).execute()
    print(f"   ✅ Node 3: {node3_data['title']} (LOCKED)")
    
    print("\n✨ Demo data seeded successfully!")
    print(f"\n📊 Summary:")
    print(f"   - 1 Goal: 'Master React Hooks'")
    print(f"   - 3 Nodes: useState (DONE) → useEffect (OPEN) → useReducer (LOCKED)")
    print(f"\n🚀 Start your servers and visit http://localhost:3000")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
