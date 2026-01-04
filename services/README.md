# Services

This directory contains all backend microservices for the GradeLoop platform.

## Structure

```
services/
├── go/                    # Go-based microservices (using Fiber framework)
│   └── auth-service/      # Authentication & authorization service
│
└── python/                # Python-based microservices (using FastAPI)
    ├── assignment-service/    # Assignment management (planned)
    ├── submission-service/    # Submission handling (planned)
    └── grading-service/       # Grading & evaluation (planned)
```

## Go Services

Go services use the [Fiber](https://gofiber.io/) framework for high-performance HTTP handling.

### Structure Template
```
service-name/
├── cmd/
│   └── main.go           # Application entry point
├── internal/
│   ├── handlers/         # HTTP handlers
│   ├── models/           # Data models
│   ├── repository/       # Database layer
│   ├── services/         # Business logic
│   └── middleware/       # Custom middleware
├── pkg/                  # Reusable packages
├── migrations/           # Database migrations
├── tests/
├── Dockerfile
└── go.mod
```

## Python Services

Python services use [FastAPI](https://fastapi.tiangolo.com/) for modern, fast API development.

### Structure Template
```
service-name/
├── app/
│   ├── api/              # API routers
│   │   └── v1/
│   ├── core/             # Config, startup, shutdown
│   ├── models/           # Pydantic & ORM models
│   ├── services/         # Business logic
│   ├── repositories/     # Database layer
│   └── main.py           # Application entry point
├── tests/
├── migrations/           # Alembic migrations
├── Dockerfile
└── requirements.txt
```

## Service Communication

Services communicate via:
- **HTTP/REST**: For synchronous operations through the API Gateway
- **gRPC**: For high-performance inter-service communication (optional)
- **Message Queue**: For asynchronous operations (Redis/RabbitMQ)

## Development

### Running a Service Locally

```bash
# Go service
cd services/go/auth-service
go run cmd/main.go

# Python service
cd services/python/assignment-service
uvicorn app.main:app --reload
```

### Running with Docker Compose

```bash
# From project root
docker-compose up <service-name>

# Or from infra/docker
cd infra/docker
docker-compose up <service-name>
```

## Adding a New Service

1. Create the service directory under `go/` or `python/`
2. Follow the structure template above
3. Add the service to `compose.yaml` and `infra/docker/docker-compose.yml`
4. Configure routing in the API Gateway
5. Update this README

## Best Practices

- **Single Responsibility**: Each service should have one clear purpose
- **Database per Service**: Each service manages its own database
- **API Contracts**: Define clear API contracts in `libs/openapi/`
- **Health Checks**: Implement `/health` and `/ready` endpoints
- **Logging**: Use structured logging (see `libs/observability/`)
- **Error Handling**: Return consistent error responses
- **Testing**: Maintain >80% code coverage
