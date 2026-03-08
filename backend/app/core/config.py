from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindLoop API"
    API_V1_STR: str = "/api/v1"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # AI / LLM
    OPENAI_API_KEY: Optional[str] = None
    
    # MCP Configuration
    # Command to run the MCP Search Server (e.g., "npx", "-y", "@modelcontextprotocol/server-brave-search")
    MCP_SEARCH_COMMAND: str = "npx"
    MCP_SEARCH_ARGS: list[str] = ["-y", "@modelcontextprotocol/server-brave-search"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
