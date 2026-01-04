# 🚀 Quick Reference - GradeLoop API Gateway

## Start/Stop

```bash
# Start (from project root)
docker-compose -f compose.yaml up -d traefik

# Start all services
docker-compose -f compose.yaml up -d

# Or use convenience script (from api-gateway/)
cd api-gateway && ./start.sh

# Stop
docker-compose -f compose.yaml stop traefik

# Or use convenience script
cd api-gateway && ./stop.sh

# Restart
docker-compose -f compose.yaml restart traefik

# View logs
docker-compose -f compose.yaml logs -f traefik
```

## Endpoints

| URL | Purpose |
|-----|---------|
| `http://localhost:80` | HTTP (redirects to HTTPS) |
| `https://localhost:443` | HTTPS entry point |
| `http://localhost:8082/metrics` | Prometheus metrics |
| `https://localhost/health` | Health check |

## Routing

```
/api/auth/*       → auth-service:8080
/api/system/*     → system-admin:8080
/api/institute/*  → institute-admin:8080
/api/instructor/* → instructor:8080
/api/student/*    → student:8080
/health           → auth-service:8080
```

## Rate Limits

```
Auth endpoints: 10/min  (burst: 20)
Student:       100/min  (burst: 200)
Instructor:    200/min  (burst: 400)
Admin:         500/min  (burst: 1000)
```

## User Headers (Injected by Auth Service)

```
X-User-Id: "12345"
X-User-Role: "student"
X-Institute-Id: "inst-001"
X-User-Email: "user@example.com"
X-User-Name: "John Doe"
```

## Auth Service Contract

**Endpoint**: `POST http://auth-service:8080/internal/auth/validate`

**Request**:
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:
```
X-User-Id: "12345"
X-User-Role: "student"
X-Institute-Id: "inst-001"
X-User-Email: "user@example.com"
X-User-Name: "John Doe"
```

**Response (401/403)**:
```json
{"error": "Unauthorized"}
```

## Backend Service Requirements

Add services to the root `compose.yaml`:

```yaml
# compose.yaml (root)
services:
  # ... traefik, web, auth-service, db, redis ...
  
  your-service:
    build:
      context: apps/your-service
      dockerfile: Dockerfile
    container_name: your-service
    expose:
      - "8080"
    environment:
      - PORT=8080
    networks:
      - gradeloop-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s

networks:
  gradeloop-net:
    driver: bridge
```

**Must implement**:
- `/health` endpoint (GET)
- Listen on port 8080
- Join `gradeloop-net` network (automatic in compose.yaml)

## Common Commands

```bash
# Check network
docker network inspect gradeloop-net

# Health check
docker exec gradeloop-api-gateway traefik healthcheck --ping

# View metrics
curl http://localhost:8082/metrics | grep traefik_entrypoint

# Test routing
curl -k https://localhost/health

# Check logs
tail -f api-gateway/logs/access.log

# Validate config
docker exec gradeloop-api-gateway cat /etc/traefik/traefik.yml
```

## Troubleshooting

### 502 Bad Gateway
```bash
# Check if backend is running
docker ps | grep auth-service

# Check network
docker network inspect gradeloop-network

# Test backend directly
docker exec auth-service curl http://localhost:8080/health
```

### 401 Unauthorized
```bash
# Check auth service logs
docker logs auth-service

# Test auth endpoint
curl -H "Authorization: Bearer <token>" \
  http://auth-service:8080/internal/auth/validate
```

### Rate limit exceeded
```bash
# Edit dynamic/middlewares.yml
# Increase average and burst values
# Restart: docker-compose restart traefik
```

## Configuration Files

```
api-gateway/
├── docker-compose.yml    # Container definition
├── traefik.yml           # Static config (entry points, logging)
├── dynamic/
│   ├── routers.yml       # Path routing
│   ├── services.yml      # Backend URLs
│   └── middlewares.yml   # Auth, CORS, rate limits
├── certs/                # TLS certificates
├── logs/                 # Access & error logs
└── README.md             # Full documentation
```

## Metrics (Prometheus)

```bash
# Request count
traefik_entrypoint_requests_total

# Request duration
traefik_entrypoint_request_duration_seconds

# Service requests
traefik_service_requests_total

# Service errors
traefik_service_request_duration_seconds
```

## Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## CORS Origins (Update in middlewares.yml)

```yaml
accessControlAllowOriginList:
  - "https://gradeloop.local"
  - "https://app.gradeloop.local"
  - "http://localhost:3000"
```

## Production Checklist

- [ ] Enable Let's Encrypt
- [ ] Update CORS origins
- [ ] Disable dashboard
- [ ] Set up log rotation
- [ ] Configure Prometheus
- [ ] Set up alerting
- [ ] Firewall rules
- [ ] Resource limits
- [ ] Backup acme.json

## Support

- **Full docs**: `README.md`
- **Architecture**: `ARCHITECTURE.md`
- **Implementation**: `IMPLEMENTATION.md`
- **Checklist**: `CHECKLIST.md`
- **Traefik docs**: https://doc.traefik.io/traefik/v3.0/
