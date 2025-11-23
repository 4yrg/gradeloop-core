
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

"""
Activating and Running the FastAPI Project
To activate
-  For Windows: source .venv/Scripts/activate
To run
- $ uvicorn main:app --reload
"""
