# GradeLoop Core Services

This repository contains the backend microservices for the GradeLoop platform.

## Services

| Service | Description | Docs |
| :--- | :--- | :--- |
| **Identity Service** | User management, authentication, and organizational structure. | [Docs](docs/identity-service.md) |
| **AuthN Service** | Authentication, token issuance, and session management. | [Docs](docs/authn-service.md) |
| **AuthZ Service** | Authorization, RBAC, permissions, and policy management. | [Docs](docs/authz-service.md) |
| **Session Service** | Session tracking, revocation, and concurrent login limits. | [Docs](docs/session-service.md) |
| **Email Service** | Transactional email sending and template management. | [Docs](docs/email-service.md) |
| **Assignment Service** | Assignment creation, management, and distribution. | [Docs](docs/assignment-service.md) |
| **Submission Service** | Student submission handling, file storage, and grading status. | [Docs](docs/submission-service.md) |

## Getting Started

1.  Copy `.env.example` to `.env` and configure environment variables.
2.  Run `docker-compose up --build` to start all services.
