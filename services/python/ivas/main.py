"""
IVAS AI Services - FastAPI Backend
Intelligent Viva Assessment System for GradeLoop
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router import router as ivas_router
from config import settings

app = FastAPI(
    title="IVAS AI Services",
    description="AI-powered services for the Intelligent Viva Assessment System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ivas_router, prefix="/ivas", tags=["IVAS"])


@app.get("/health")
def health():
    """Root health check endpoint"""
    return {"status": "healthy", "service": "ivas-ai-services"}


@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "name": "IVAS AI Services",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
