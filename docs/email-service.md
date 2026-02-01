# Email Service

## Overview
The Email Service handles outgoing email communication. It provides a unified API for sending transactional emails (like welcome messages, password resets) using SMTP providers and manages HTML email templates.

## Responsibilities
- **Email Sending**: Relaying emails via SMTP (e.g., Gmail, SendGrid).
- **Template Management**: Storing and retrieving HTML email templates.
- **Logging**: Tracking sent emails (basic logging).

## Architecture
- **Language**: Go
- **Framework**: Fiber
- **Database**: SQLite (`email_db` - configurable via `EMAIL_DB_NAME`)
- **ORM**: GORM (implied by repository usage)
- **SMTP**: Native Go SMTP

## API Endpoints
All endpoints are internal and prefixed with `/internal/email`. They require `X-Internal-Token`.

### Email Operations
| Method | Endpoint | Description | Payloads |
| :--- | :--- | :--- | :--- |
| `POST` | `/send` | Send email using template | `{template_name, recipient, data}` |
| `POST` | `/send-raw` | Send raw HTML/Text email | `{to, subject, body}` |

### Template Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/templates` | Create new template |
| `GET` | `/templates` | List all templates |
| `GET` | `/templates/:name` | Get specific template |

### Logs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/logs` | Get email logs |

## Configuration
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Service port | No | `5005` (implied) |
| `EMAIL_DB_NAME` | SQLite DB name | No | `email_db` |
| `SMTP_HOST` | SMTP Server Host | Yes | `localhost` |
| `SMTP_PORT` | SMTP Server Port | Yes | `587` |
| `SMTP_USERNAME` | SMTP Username | Yes | - |
| `SMTP_PASSWORD` | SMTP Password | Yes | - |
| `SMTP_FROM` | Default From Address | Yes | `no-reply@example.com` |

## Running Locally
```bash
go run services/go/email/cmd/main.go
```
