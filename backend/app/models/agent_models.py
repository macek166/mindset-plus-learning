from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

# --- Shared Models ---

class KPI(BaseModel):
    id: str = Field(..., description="Unique identifier for the KPI (e.g., 'kpi_1')")
    description: str = Field(..., description="The concept or fact the user must understand")
    importance: str = Field("essential", description="Level of importance: essential | nice_to_have")

class Concept(BaseModel):
    term: str = Field(..., description="The term or concept name")
    definition: str = Field(..., description="Short definition of the concept as used in context")
    status: str = Field("DISCOVERED", description="Status: DISCOVERED | MASTERED")

# --- Planner Agent Models ---

class PlannerInput(BaseModel):
    goal_title: str
    goal_description: str
    goal_type: str = Field(..., pattern="^(SKILL|KNOWLEDGE)$")
    level: str = Field("ADVANCED", pattern="^(BASIC|ADVANCED|EXPERT)$", description="Content depth level")

class MilestoneNode(BaseModel):
    title: str
    description: str
    estimated_difficulty: int = Field(1, ge=1, le=10)

class PlannerOutput(BaseModel):
    plan_explanation: str
    milestones: List[MilestoneNode]

# --- Content Agent Models ---

class ContentInput(BaseModel):
    node_title: str
    node_context: Optional[str] = None
    depth_level: int = 1  # 1-10
    style_level: str = "BASIC" # BASIC, ACADEMIC, EXPERT
    previous_missed_kpis: Optional[List[str]] = None
    is_remedial: bool = False
    is_tuning: bool = False # New flag

class ContentOutput(BaseModel):
    title: str
    content_markdown: str = Field(..., description="Educational content in Markdown with LaTeX")
    kpis: List[KPI] = Field(default_factory=list, description="Key Performance Indicators")
    citations: List[str] = Field(default_factory=list, description="List of source URLs or citations")

# --- Evaluator Agent Models ---

class EvaluatorInput(BaseModel):
    original_content: str
    kpis: List[KPI]
    user_essay: str
    depth_level: int

class EvaluatorOutput(BaseModel):
    passed: bool
    score: int = Field(..., ge=0, le=100)
    feedback: str = Field(..., description="Constructive feedback for the user")
    missed_kpi_ids: List[str] = Field(default_factory=list, description="IDs of KPIs that were not adequately addressed")
    semantic_embedding_text: str = Field(..., description="Summary text to be embedded for knowledge tracking")
    suggested_remedial_topic: Optional[str] = Field(None, description="If failed, a specific topic to review")
    extracted_concepts: List[Concept] = Field(default_factory=list, description="Concepts identified in the user's essay")

