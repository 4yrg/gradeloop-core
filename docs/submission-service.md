# Submission Service

## Overview
The Submission Service handles student submissions for assignments. It accepts code files, keystroke analytics, and auth fingerprints, storing files in Supabase Storage and metadata in PostgreSQL.

## Responsibilities
- **Submission Handling**: processing multipart submissions (files + metadata).
- **File Storage**: Uploading submission files to object storage (Supabase).
- **Grading/Status**: Tracking the status (pending, graded) and score of submissions.

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: PostgreSQL (`submission` database)
- **Object Storage**: Supabase Storage (`submissions` bucket)
- **ORM**: GORM

## API Endpoints
All endpoints are prefixed with `/api/v1/submissions`.

| Method | Endpoint | Description | Payloads |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create a submission | `{assignmentId, studentId, language, files: [{filename, content}], ...}` |
| `GET` | `/` | List submissions | Filter by `?assignmentId=` or `?studentId=` |
| `GET` | `/:id` | Get submission details | - |
| `PATCH` | `/:id/status` | Update status/score | `{status, score}` |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `8006` |
| `SUBMISSION_DATABASE_URL` | Postgres Connection String | Yes | - |
| `DATABASE_URL` | Fallback connection string | No | - |
| `SUPABASE_URL` | Supabase API URL | Yes | - |
| `SUPABASE_SERVICE_KEY` | Supabase Service Key | Yes | - |
| `SUPABASE_STORAGE_BUCKET` | Storage Bucket Name | Yes | - |

## Running Locally
```bash
go run services/go/submission/cmd/server/main.go
```
