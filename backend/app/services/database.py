from supabase import create_client, Client
from ..core.config import settings
from uuid import UUID
from typing import List, Optional, Any
from datetime import datetime

class DatabaseService:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    async def get_node(self, node_id: UUID) -> Optional[dict]:
        try:
            response = self.client.table("nodes").select("*").eq("id", str(node_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error fetching node: {e}")
            return None

    async def create_test_attempt(self, attempt_data: dict):
        try:
            self.client.table("test_attempts").insert(attempt_data).execute()
        except Exception as e:
            print(f"Error creating test attempt: {e}")
            raise e

    async def update_node_status(self, node_id: UUID, status: str, next_review: datetime):
        try:
            self.client.table("nodes").update({
                "status": status,
                "next_review_at": next_review.isoformat()
            }).eq("id", str(node_id)).execute()
        except Exception as e:
            print(f"Error updating node status: {e}")
            raise e

    async def create_remedial_node(self, parent_id: UUID, goal_id: UUID, topic: str, depth_level: int = 2) -> str:
        try:
            # Create a new node
            # Note: Content is empty initially, waiting for Content_Agent
            new_node = {
                "goal_id": str(goal_id),
                "parent_node_id": str(parent_id),
                "title": topic,
                "status": "OPEN", # Remedial nodes should be immediately accessible
                "content_md": f"# {topic}\n\n*Generování nápravného obsahu...*",
                "kpis": [],
                "depth_level": depth_level
            }
            response = self.client.table("nodes").insert(new_node).execute()
            if response.data:
                return response.data[0]['id']
            return ""
        except Exception as e:
            print(f"Error creating remedial node: {e}")
            raise e

    async def create_goal(self, user_id: UUID, title: str, description: str, type: str) -> str:
        # Note: Description is not in schema currently, we might rely on Nodes to hold detail, or update schema.
        # The schema has 'title', 'type', 'created_at'.
        # We will assume 'description' might be stored or just used for generation. 
        # For now, let's just insert what we have in schema.
        try:
            goal_data = {
                "user_id": str(user_id),
                "title": title,
                "type": type.upper() # SKILL or KNOWLEDGE
            }
            response = self.client.table("goals").insert(goal_data).execute()
            if response.data:
                return response.data[0]['id']
            return ""
        except Exception as e:
            print(f"Error creating goal: {e}")
            raise e

    async def create_nodes_bulk(self, nodes_data: List[dict]):
        try:
            # nodes_data should be a list of dicts matching 'nodes' table schema
            self.client.table("nodes").insert(nodes_data).execute()
        except Exception as e:
            print(f"Error creating nodes bulk: {e}")
            raise e

# Singleton-ish pattern for now, or just instantiate per request
db_service = DatabaseService()
