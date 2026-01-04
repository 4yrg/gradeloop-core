# GradeLoop API Gateway

Production-grade API Gateway using **Traefik v3.6** for the GradeLoop microservice-based Learning Management System.

## Overview

This API Gateway serves as the **single secure entry point** for all frontend requests, providing:

- **Centralized routing** to backend microservices
- **JWT-based authentication** via ForwardAuth
- **Role-based access control** (RBAC)
- **Rate limiting** per user role
- **CORS** policy enforcement
- **HTTPS enforcement** with automatic TLS
- **Observability** via metrics and logging

---

## Architecture

```
Frontend (HTTPS) → Traefik Gateway → Backend Services
                         ↓
                   Auth Service (JWT validation)
```

### Request Flow

1. **Client** sends HTTPS request to `https://api.gradeloop.local/api/{service}/*`
2. **Traefik** matches request to router based on path prefix
3. **ForwardAuth middleware** sends auth request to `auth-service:8080/internal/auth/validate`
4. **Auth service** validates JWT and returns:
   - `200 OK` → Request proceeds with user context headers
   - `401 Unauthorized` → Request rejected
   - `403 Forbidden` → Request rejected
5. **Role middleware** checks `X-User-Role` header
6. **Rate limiter** enforces role-based limits
7. **Backend service** receives request with injected headers:
   - `X-User-Id`
   - `X-User-Role`
   - `X-Institute-Id`
   - `X-User-Email`
   - `X-User-Name`

---

## Folder Structure

```
api-gateway/
├── docker-compose.yml          # Traefik container definition
├── traefik.yml                 # Static configuration
├── dynamic/
│   ├── routers.yml             # HTTP routers (path-based routing)
│   ├── services.yml            # Backend service definitions
│   └── middlewares.yml         # Auth, CORS, rate limiting, security
├── certs/                      # TLS certificates (auto-generated)
│   └── acme.json               # Let's Encrypt certificate storage
├── logs/                       # Access and error logs
│   ├── access.log
│   └── traefik.log
└── README.md                   # This file
```

---

## Routing Table

| Path Prefix         | Backend Service       | Required Role(s)                                      |
|---------------------|-----------------------|-------------------------------------------------------|
| `/api/auth/*`       | `auth-service`        | None (public)                                         |
| `/api/system/*`     | `system-admin`        | `system-admin`                                        |
| `/api/institute/*`  | `institute-admin`     | `institute-admin`, `system-admin`                     |
| `/api/instructor/*` | `instructor`          | `instructor`, `institute-admin`, `system-admin`       |
| `/api/student/*`    | `student`             | `student`, `instructor`, `institute-admin`, `system-admin` |
| `/health`           | `auth-service`        | None (public)                                         |

---

## User Roles

- **`system-admin`**: Full system access
- **`institute-admin`**: Institute-level administration
- **`instructor`**: Course and student management
- **`student`**: Course enrollment and submissions

---

## Rate Limiting

| Role              | Average Requests/min | Burst |
|-------------------|----------------------|-------|
| Auth endpoints    | 10                   | 20    |
| Student           | 100                  | 200   |
| Instructor        | 200                  | 400   |
| Admin             | 500                  | 1000  |

---

## Prerequisites

### 1. Docker Network

The project uses a shared Docker bridge network `gradeloop-net` defined in the root `compose.yaml`.

### 2. Backend Services

Each backend service must:

- Run on the `gradeloop-net` Docker network (automatically configured in root compose.yaml)
- Expose port `8080` internally
- Implement `/health` endpoint
- Use Docker service names:
  - `auth-service`
  - `system-admin`
  - `institute-admin`
  - `instructor`
  - `student`

### 3. Auth Service Requirements

The `auth-service` must implement:

**Endpoint**: `POST /internal/auth/validate`

**Request Headers**:
- `Authorization: Bearer <jwt_token>`

**Response**:
- **200 OK**: Valid token
  ```json
  Headers:
    X-User-Id: "12345"
    X-User-Role: "student"
    X-Institute-Id: "inst-001"
    X-User-Email: "student@example.com"
    X-User-Name: "John Doe"
  ```
- **401 Unauthorized**: Invalid/expired token
- **403 Forbidden**: Valid token but insufficient permissions

---

## Deployment

### Step 1: Start All Services

From the project root:

```bash
docker-compose -f compose.yaml up -d
```

This will start:
- Traefik API Gateway (with config from `api-gateway/`)
- All backend services
- Database and Redis

### Step 2: Verify Gateway Health

```bash
# Check Traefik health
docker exec gradeloop-api-gateway traefik healthcheck --ping

# Check logs
docker-compose logs -f traefik
```

### Step 3: Verify Services

```bash
# List all services on the network
docker network inspect gradeloop-net

# Test health endpoint
curl https://localhost/health
```

---

## Integration with Backend Services

Backend services are defined in the root `compose.yaml` and automatically join the `gradeloop-net` network:

```yaml
# Example: Adding a new backend service to compose.yaml
services:
  # ... existing services (traefik, web, auth-service, etc.)
  
  system-admin:
    build:
      context: apps/system-admin
      dockerfile: Dockerfile
    container_name: system-admin
    expose:
      - "8080"
    environment:
      - PORT=8080
      - DATABASE_URL=postgres://postgres:postgres@db:5432/gradeloop
    networks:
      - gradeloop-net
    depends_on:
      - db
      - auth-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3

networks:
  gradeloop-net:
    driver: bridge
```

**Note**: Backend services do NOT need Traefik labels. Routing is handled by the dynamic configuration in `api-gateway/dynamic/routers.yml`.

---

## Observability

### Metrics

Prometheus metrics available at:

```
http://localhost:8082/metrics
```

**Key Metrics**:
- `traefik_entrypoint_requests_total`
- `traefik_entrypoint_request_duration_seconds`
- `traefik_service_requests_total`
- `traefik_service_request_duration_seconds`

### Logs

**Access logs**: `logs/access.log` (JSON format)

**Traefik logs**: `logs/traefik.log` (JSON format)

**Example log entry**:
```json
{
  "ClientAddr": "192.168.1.100:54321",
  "RequestMethod": "GET",
  "RequestPath": "/api/student/courses",
  "RequestProtocol": "HTTP/2.0",
  "RequestHost": "api.gradeloop.local",
  "DownstreamStatus": 200,
  "Duration": 123456789,
  "OriginStatus": 200,
  "ServiceName": "student-service",
  "RouterName": "student-router"
}
```

---

## Security Features

### 1. HTTPS Enforcement
- All HTTP requests redirect to HTTPS
- TLS 1.2+ only
- HSTS enabled with 1-year max-age

### 2. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 3. CORS Policy
- Allowed origins: `https://gradeloop.local`, `http://localhost:3000`
- Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Credentials enabled
- Preflight cache: 1 hour

### 4. Rate Limiting
- Per-user rate limiting using `X-User-Id` header
- IP-based rate limiting for auth endpoints
- Automatic burst handling

### 5. Request Size Limits
- Max request body: 10MB
- Max response body: 10MB
- Memory buffering: 2MB

---

## Configuration Updates

### Adding a New Service

1. **Add router** in `dynamic/routers.yml`:
```yaml
new-service-router:
  rule: "PathPrefix(`/api/newservice`)"
  entryPoints:
    - websecure
  service: new-service
  middlewares:
    - cors-headers
    - security-headers
    - forward-auth
    - rate-limit-student
  tls:
    certResolver: letsencrypt
```

2. **Add service** in `dynamic/services.yml`:
```yaml
new-service:
  loadBalancer:
    servers:
      - url: "http://new-service:8080"
    healthCheck:
      path: /health
      interval: 30s
```

3. **Reload configuration**:
```bash
docker-compose restart traefik
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Backend service not reachable

**Solution**:
```bash
# Check if service is on the network
docker network inspect gradeloop-network

# Check service health
docker exec auth-service curl http://localhost:8080/health
```

### Issue: 401 Unauthorized

**Cause**: ForwardAuth failing

**Solution**:
```bash
# Check auth-service logs
docker logs auth-service

# Test auth endpoint directly
curl -H "Authorization: Bearer <token>" \
  http://auth-service:8080/internal/auth/validate
```

### Issue: Rate limit exceeded

**Cause**: Too many requests

**Solution**: Adjust rate limits in `dynamic/middlewares.yml`:
```yaml
rate-limit-student:
  rateLimit:
    average: 200  # Increase from 100
    burst: 400    # Increase from 200
```

---

## Environment Variables

Configure in `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `TZ` | Timezone for logs | `UTC` |
| `TRAEFIK_LOG_LEVEL` | Log level | `INFO` |

---

## Production Checklist

- [ ] Enable HTTPS with valid TLS certificates
- [ ] Disable Traefik dashboard or secure with authentication
- [ ] Configure proper CORS origins (remove localhost)
- [ ] Set up log rotation
- [ ] Configure Prometheus scraping
- [ ] Set up alerting for 5xx errors
- [ ] Enable distributed tracing (Jaeger/Zipkin)
- [ ] Configure firewall rules (allow only 80, 443)
- [ ] Set resource limits in docker-compose.yml
- [ ] Enable Docker socket proxy (instead of direct socket access)
- [ ] Review and adjust rate limits
- [ ] Set up backup for `certs/acme.json`

---

## Development vs Production

### Development

```yaml
# traefik.yml
api:
  dashboard: true
  insecure: true

# Use self-signed certs or HTTP
```

### Production

```yaml
# traefik.yml
api:
  dashboard: false
  insecure: false

# Use Let's Encrypt
certificatesResolvers:
  letsencrypt:
    acme:
      caServer: "https://acme-v02.api.letsencrypt.org/directory"
```

---

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f traefik`
2. Verify network: `docker network inspect gradeloop-network`
3. Test health: `curl https://api.gradeloop.local/health`
4. Review Traefik docs: https://doc.traefik.io/traefik/v3.0/

---

## License

Internal use only - GradeLoop LMS Platform
