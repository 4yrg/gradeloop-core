# Assignment Service

## Overview
The Assignment Service manages the lifecycle of assignments within classes. It allows instructors to create, update, and grade assignments, and students to view them.

## Responsibilities
- **Assignment Management**: CRUD operations for assignments.
- **Filtering**: Listing assignments by course ID.

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: PostgreSQL (`assignment` database)
- **ORM**: GORM

## API Endpoints
All endpoints are prefixed with `/api/v1/assignments`.

| Method | Endpoint | Description | Payloads |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create a new assignment | `{title, description, due_date, course_id, ...}` |
| `GET` | `/` | List all assignments (optional `?courseId=`) | - |
| `GET` | `/:id` | Get assignment details | - |
| `PUT` | `/:id` | Update assignment | `{title, description, ...}` |
| `DELETE` | `/:id` | Delete assignment | - |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `8005` |
| `ASSIGNMENT_DATABASE_URL` | Postgres Connection String | Yes | - |
| `DATABASE_URL` | Fallback connection string | No | - |

## Running Locally
```bash
go run services/go/assignment/cmd/server/main.go
```
