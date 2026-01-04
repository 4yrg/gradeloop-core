# Python Services

Python-based microservices using the FastAPI framework.

## Services

### assignment-service (planned)
Assignment management and templates.

### submission-service (planned)
Submission handling and file processing.

### grading-service (planned)
Auto-grading and rubric evaluation.

## Adding a New Python Service

1. Create service directory:
```bash
mkdir -p services/python/service-name
cd services/python/service-name
```

2. Create directory structure:
```bash
mkdir -p app/{api/v1,core,models,services,repositories} tests migrations
```

3. Create main.py:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Service Name")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

4. Create requirements.txt:
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
sqlalchemy==2.0.25
alembic==1.13.1
python-dotenv==1.0.0
```

5. Create Dockerfile:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

6. Add to docker-compose.yml
7. Update API Gateway routing

## Best Practices

- Use Pydantic for data validation
- Implement dependency injection
- Use async/await for I/O operations
- Type hints everywhere
- Comprehensive error handling
- Structured logging
- Write unit and integration tests
- Use Alembic for database migrations

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
isort app/

# Lint
flake8 app/
```
