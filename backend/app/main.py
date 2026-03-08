from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.mcp import mcp_client
from .api.endpoints import evaluate, onboarding, concepts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect specific resources if needed
    # MCP connection is lazy-loaded in the client, but we could warm it up here
    yield
    # Shutdown: Clean up resources
    await mcp_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(evaluate.router, prefix=settings.API_V1_STR, tags=["evaluation"])
app.include_router(onboarding.router, prefix=settings.API_V1_STR, tags=["onboarding"])
app.include_router(concepts.router, prefix=settings.API_V1_STR, tags=["concepts"])

@app.get("/")
def root():
    return {"message": "Welcome to MindLoop API"}
