# Identity Service

## Overview
The Identity Service is the source of truth for user identities and the organizational structure of the institution. It manages users, profiles (students, instructors, admins), and the hierarchy of institutes, faculties, departments, and classes.

## Responsibilities
- **User Management**: Registration, profile updates, and retrieval.
- **Credential Management**: Password verification and updates (hashing).
- **Organization Management**: CRUD operations for Institutes, Faculties, Departments, and Classes.
- **Enrollment**: Managing student enrollments in classes.

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: PostgreSQL (`identity` database)
- **ORM**: GORM

## API Endpoints
All endpoints are prefixed with `/internal/identity` and protected by `X-Internal-Token` (except where noted otherwise in gateway config).

### User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/users` | Register a new user |
| `GET` | `/users/:id` | Get user details |
| `PATCH` | `/users/:id` | Update user profile |
| `DELETE` | `/users/:id` | Delete a user |
| `POST` | `/users/lookup` | Lookup user by email |

### Credentials
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/credentials/verify` | Verify email/password |
| `POST` | `/credentials/update` | Update password |

### Organization Structure
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET/POST` | `/orgs/institutes` | Manage Institutes |
| `GET/POST` | `/orgs/faculties` | Manage Faculties |
| `GET/POST` | `/orgs/departments` | Manage Departments |
| `GET/POST` | `/orgs/classes` | Manage Classes |
| `POST` | `/orgs/classes/:id/enrollments` | Enroll student |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `8001` |
| `IDENTITY_DATABASE_URL` | Postgres Connection String | Yes | - |
| `DATABASE_URL` | Fallback connection string | No | - |

## Running Locally
```bash
go run services/go/identity/cmd/server/main.go
```

## Seeding System Admin
To seed the initial System Admin user, ensure the following environment variables are set in your `.env` file:
```env
SYS_ADMIN_EMAIL="admin@gradeloop.com"
SYS_ADMIN_PW="secure-password"
```

Then run the seeding script:
```bash
cd services/go/identity
go run cmd/seed-admin/main.go
```
