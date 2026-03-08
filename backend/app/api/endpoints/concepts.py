from fastapi import APIRouter, HTTPException
from ...services.database import db_service

router = APIRouter()

@router.get("/user_concepts/{user_id}")
async def get_user_concepts(user_id: str, node_id: str = None):
    """
    Fetch all saved concepts for a user, optionally filtered by node_id.
    """
    try:
        query = db_service.client.table("saved_concepts").select("*").eq("user_id", user_id)
        if node_id:
            query = query.eq("node_id", node_id)
            
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
