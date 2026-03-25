"""
ClearFlow API - Main Application Entry Point

AI-Powered Investment and Portfolio Intelligence Platform
A subsidiary of Jbryanson Globals Limited
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("Starting ClearFlow API...")
    await init_db()
    print("Database initialized")
    yield
    # Shutdown
    print("Shutting down ClearFlow API...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="""
    ClearFlow - AI-Powered Investment and Portfolio Intelligence Platform

    ## Features
    - Portfolio Overview Dashboard
    - AI Investment Recommendations
    - Predictive Market Analytics
    - Risk Management Tools
    - Tax Optimization Dashboard
    - Reports & Insights
    - Robo-Advisor Automation

    ## About
    A subsidiary of Jbryanson Globals Limited
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS - Add middleware before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Global exception handler — ensures CORS headers are present even on 500s
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Include API routes
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "ClearFlow API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
