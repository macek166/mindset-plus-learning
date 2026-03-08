from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from uuid import UUID

from ...models.agent_models import PlannerInput, PlannerOutput, MilestoneNode, ContentInput
from ...services.database import db_service
from ...agents import planner_agent, content_agent, PlannerAgent

router = APIRouter()

# Dependency injection for Agent (allows swapping if needed, but we use the singleton now)
async def get_planner_agent():
    return planner_agent

class CreateGoalRequest(PlannerInput):
    user_id: UUID # In production, extract from JWT

@router.post("/create_goal")
async def create_goal(
    request: CreateGoalRequest,
    agent: PlannerAgent = Depends(get_planner_agent)
):
    """
    Onboarding Phase:
    1. User defines Goal.
    2. Planner Agent generates milestones.
    3. System saves Goal and Nodes (linear chain).
    4. Content Agent generates content for the FIRST node immediately.
    """
    
    # 1. Generate Plan
    try:
        plan = await agent.plan(request)
    except Exception as e:
        print(f"Planning failed: {e}")
        raise HTTPException(status_code=503, detail="AI Planner unavailable")
        
    # 2. Save Goal
    try:
        goal_id = await db_service.create_goal(
            user_id=request.user_id,
            title=request.goal_title,
            description=request.goal_description,
            type=request.goal_type
        )
    except Exception as e:
        print(f"DB Error: {e}")
        raise HTTPException(status_code=500, detail="Database error creating goal")
    
    if not goal_id:
         raise HTTPException(status_code=500, detail="Failed to create goal")

    # 3. Create Nodes (Linear Chain)
    previous_node_id = None
    created_nodes: List[dict] = []

    for i, milestone in enumerate(plan.milestones):
        is_first = (i == 0)
        status = "OPEN" if is_first else "LOCKED"
        
        node_data = {
            "goal_id": goal_id,
            "title": milestone.title,
            "content_md": None, # Filled later
            "kpis": [], # Filled later
            "status": status,
            "depth_level": 1, # Main path is always Level 1
            "parent_node_id": previous_node_id
        }
        
        try:
            res = db_service.client.table("nodes").insert(node_data).execute()
            if res.data:
                new_node = res.data[0]
                created_nodes.append(new_node)
                previous_node_id = new_node['id']
                
                # 4. Generate Content for FIRST Node ONLY (to speed up response)
                if is_first:
                    content_result = await content_agent.generate_content(ContentInput(
                        node_title=new_node['title'],
                        node_context=request.goal_description,
                        depth_level=1,
                        style_level=request.level # Use the user-selected level
                    ))
                    
                    # Update Node with Content
                    update_data = {
                        "content_md": content_result.content_markdown,
                        "kpis": [k.model_dump() for k in content_result.kpis]
                    }
                    db_service.client.table("nodes").update(update_data).eq("id", new_node['id']).execute()
                    
        except Exception as e:
            print(f"Error creating node {i}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save curriculum node {i}")

    return {
        "goal_id": goal_id,
        "plan": plan,
        "nodes_created": len(created_nodes)
    }
