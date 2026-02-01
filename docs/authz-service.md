# Authorization (AuthZ) Service

## Overview
The Authorization Service implements Role-Based Access Control (RBAC). It manages roles, permissions, and policies to determine what resources a user can access and what actions they can perform.

## Responsibilities
- **RBAC Enforcement**: Checking if a user (subject) with a specific role has permission for an action on a resource.
- **Policy Management**: Creating roles and permissions, and assigning permissions to roles.
- **Permission Resolution**: Resolving all permissions for a given user/role context.

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: PostgreSQL (`authz` database)
- **ORM**: GORM

## API Endpoints
All endpoints are internal and prefixed with `/internal/authz`. They require `X-Internal-Token`.

### Permission Checks
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/check` | Check specific permission |
| `POST` | `/resolve` | Resolve all permissions for role |

### Role Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/roles` | Create a new role |
| `GET` | `/roles` | List all roles |
| `PATCH` | `/roles/:name` | Update a role |
| `DELETE` | `/roles/:name` | Delete a role |

### Permission Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/permissions` | Create a permission |
| `GET` | `/permissions` | List all permissions |
| `DELETE` | `/permissions/:name` | Delete a permission |
| `POST` | `/permissions/assign` | Assign permission to role |
| `POST` | `/permissions/revoke` | Revoke permission from role |

### Policy Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/policies` | Create policy (Role-Perm mapping) |
| `GET` | `/policies` | List policies |
| `DELETE` | `/policies/:id` | Delete policy |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `8004` |
| `AUTHZ_DATABASE_URL` | Postgres Connection String | Yes | - |
| `DATABASE_URL` | Fallback connection string | No | - |

## Running Locally
```bash
go run services/go/authz/cmd/server/main.go
```
