# AuthN Service

## Overview
The Authentication (AuthN) Service is responsible for verifying user credentials, managing sessions, and issuing tokens (Access & Refresh). It acts as the gatekeeper for user entry into the system.

## Responsibilities
- **Authentication**: Verifying email/password via Identity Service.
- **Session Management**: Coordinating with Session Service to create/revoke sessions.
- **Token Management**: Generating JWT Access Tokens and handling Refresh Tokens.
- **Password Reset**: Orchestrating the forgot/reset password flow.

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: None (Stateless, relies on Redis & other services)
- **Caching**: Redis (for reset tokens and validation)

## API Endpoints

### Public Auth Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user and get tokens |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout (revoke session) |
| `POST` | `/auth/forgot-password` | Initiate password reset |
| `POST` | `/auth/reset-password` | Complete password reset |
| `GET` | `/auth/validate` | Validate access token |

### Internal Endpoints
Protected by `X-Internal-Token`.
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/internal/authn/issue-token` | Issue token for delegated auth |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `8003` |
| `REDIS_ADDR` | Redis address | Yes | `localhost:6379` |
| `IDENTITY_SERVICE_URL` | URL of Identity Service | Yes | `http://localhost:8001` |
| `SESSION_SERVICE_URL` | URL of Session Service | Yes | `http://localhost:8002` |
| `AUTHZ_SERVICE_URL` | URL of AuthZ Service | Yes | `http://localhost:8004` |
| `EMAIL_SERVICE_URL` | URL of Email Service | Yes | `http://localhost:5005` |
| `INTERNAL_SECRET` | Secret for internal inter-service auth | Yes | - |
| `WEB_URL` | Frontend URL for reset links | Yes | `http://localhost:3000` |

## Running Locally
```bash
go run services/go/authn/cmd/server/main.go
```
