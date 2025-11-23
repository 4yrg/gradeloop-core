
from fastapi import FastAPI
from app.api.routers import api_router

app = FastAPI()

app.include_router(api_router)

"""
Activating and Running the FastAPI Project
To activate
-  For Windows: source .venv/Scripts/activate
To run
- $ uvicorn main:app --reload
"""
