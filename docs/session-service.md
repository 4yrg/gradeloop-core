# Session Management Service

## Overview
The Session Management Service handles the lifecycle of user sessions. It tracks active sessions, handles token rotation, and enforces concurrent session limits.

## Responsibilities
- **Session Creation**: Generating new sessions upon user login.
- **Token Validation**: Verifying if a session ID and refresh token are valid.
- **Session Refresh**: Rolling refresh tokens and updating session expiry.
- **Revocation**: Manually revoking specific sessions or all sessions for a user.

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: PostgreSQL (`session` database) or SQLite (dev fallback)
- **Caching**: Redis (for high-speed session validation)

## API Endpoints
All endpoints are internal and prefixed with `/internal/sessions` (except user revocation). They require `X-Internal-Token`.

### Session Lifecycle
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/internal/sessions` | Create a new session |
| `POST` | `/internal/sessions/validate` | Validate a session |
| `GET` | `/internal/sessions/:id` | Get session details |
| `POST` | `/internal/sessions/refresh` | Refresh a session |
| `POST` | `/internal/sessions/:id/revoke` | Revoke a session |

### User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/internal/users/:userId/sessions/revoke` | Revoke all sessions for a user |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `8002` |
| `REDIS_ADDR` | Redis address | Yes | `localhost:6379` |
| `SESSION_DATABASE_URL` | Postgres Connection String | Yes | - |
| `DATABASE_URL` | Fallback connection string | No | - |
| `SQLITE_PATH` | Path for SQLite DB (if PG fails) | No | `session.db` |

## Running Locally
```bash
go run services/go/session/cmd/server/main.go
```
