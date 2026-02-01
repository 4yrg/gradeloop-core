# [Service Name] Service

## Overview
[Brief description of what the service does and its role in the system.]

## Responsibilities
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

## Architecture
- **Language:** Go
- **Framework:** Fiber
- **Database:** [PostgreSQL / None]
- **Caching:** [Redis / None]

## API Endpoints

### [Resource Name]
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/resource` | List resources | Yes |
| `POST` | `/resource` | Create resource | Yes |

## Configuration
The service is configured via environment variables:

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `80xx` |
| `DATABASE_URL` | Database connection string | Yes | - |
| `REDIS_ADDR` | Redis address | Yes | - |

## Running Locally
```bash
# From project root
go run services/go/[service-name]/cmd/server/main.go
```
