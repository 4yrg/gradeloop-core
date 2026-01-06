# Keystroke Service Integration Guide

This document describes the integration of the Keystroke Dynamics Authentication Service into the GradeLoop microservices architecture.

## Overview

The keystroke service is now integrated as a Python microservice that provides behavioral biometrics for continuous student authentication.

## Architecture

```
┌─────────────┐
│   Client    │
│  (Web/App)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│   API Gateway (Go)      │
│   Port: 80              │
│   Route: /api/keystroke │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│ Keystroke Service (Py)   │
│ Port: 8080 (8002 host)   │
│ Framework: FastAPI       │
└──────────────────────────┘
```

## Service Configuration

### Docker Compose
The keystroke service is defined in `infra/docker/docker-compose.yml`:

```yaml
keystroke-service:
  build:
    context: ../../services/python/keystroke-service
  container_name: gradeloop-keystroke-service
  ports:
    - "8002:8080"
  environment:
    - PORT=8080
    - DEVICE=cpu
  networks:
    - gradeloop-net
```

### API Gateway Routing
Routes are configured in `services/go/api-gateway/routes/routes.go`:

```go
keystroke := api.Group("/keystroke")
keystroke.Use(middlewares.JWTMiddleware(cfg))
keystroke.All("/*", services.ProxyService(cfg.KeystrokeServiceURL))
```

**Key Points:**
- Base path: `/api/keystroke/*`
- Protected by JWT authentication
- All requests are proxied to `http://keystroke-service:8080`

## API Endpoints

All endpoints are accessible through the API Gateway with JWT authentication.

### Public Endpoints (Direct Access for Testing)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Service information |

### Protected Endpoints (via Gateway)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/keystroke/capture` | Capture keystroke events |
| POST | `/api/keystroke/enroll` | Enroll a new user |
| POST | `/api/keystroke/verify` | Verify user identity |
| POST | `/api/keystroke/identify` | Identify user (1:N) |
| POST | `/api/keystroke/monitor` | Monitor active session |
| GET | `/api/keystroke/users/enrolled` | List enrolled users |
| GET | `/api/keystroke/session/status/{user_id}/{session_id}` | Get session status |
| DELETE | `/api/keystroke/session/{user_id}/{session_id}` | End session |

### WebSocket

| Type | Path | Description |
|------|------|-------------|
| WS | `/ws/monitor/{user_id}/{session_id}` | Real-time monitoring |

## Starting the Services

### Using Docker Compose (Recommended)

```bash
cd infra/docker
docker compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Auth service (Go)
- API Gateway (Go)
- Keystroke service (Python)

### Check Service Status

```bash
# Check all services
docker compose ps

# Check keystroke service logs
docker compose logs keystroke-service

# Check API gateway logs
docker compose logs api-gateway
```

## Testing the Integration

### 1. Direct Service Test (Without Gateway)

Test the service directly on port 8002:

```bash
# Health check
curl http://localhost:8002/health

# List enrolled users
curl http://localhost:8002/api/keystroke/users/enrolled
```

Using PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8002/health"
```

### 2. Through API Gateway (With JWT)

First, get a JWT token by logging in:

```bash
# Login (replace with actual credentials)
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Then use the token to access keystroke endpoints:

```bash
# List enrolled users through gateway
curl -X GET http://localhost/api/keystroke/users/enrolled \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

PowerShell:
```powershell
# Login
$body = @{email="user@example.com"; password="password"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token

# Access keystroke service
$headers = @{Authorization="Bearer $token"}
Invoke-RestMethod -Uri "http://localhost/api/keystroke/users/enrolled" -Headers $headers
```

### 3. Automated Tests

Run the Python test script:

```bash
cd services/python/keystroke-service

# Install dependencies first
pip install -r requirements.txt

# Start the service locally
python main.py

# In another terminal, run tests
python test_api.py
```

Run the PowerShell integration test:

```powershell
cd services\python\keystroke-service
.\test_integration.ps1
```

## Frontend Integration

To integrate with the frontend, use the `use-keystroke-capture.ts` hook from the web app:

```typescript
import { useKeystrokeCapture } from '@/hooks/use-keystroke-capture';

// In your component
const { capturedCount, isCapturing, startCapture, stopCapture } = useKeystrokeCapture({
  userId: 'user123',
  onEnrollmentReady: async (events) => {
    // Send to API Gateway
    const response = await fetch('/api/keystroke/enroll', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'user123',
        keystrokeEvents: events
      })
    });
  }
});
```

## Environment Variables

### Keystroke Service
- `PORT` - Service port (default: 8080)
- `DEVICE` - Computing device: 'cpu' or 'cuda' (default: cpu)

### API Gateway
- `KEYSTROKE_SERVICE_URL` - Keystroke service URL (default: http://keystroke-service:8080)

## Data Persistence

User templates are stored in a Docker volume:
- Volume: `keystroke-models`
- Mount point: `/app/models`
- File: `user_templates.pkl`

To backup templates:
```bash
docker cp gradeloop-keystroke-service:/app/models/user_templates.pkl ./backup/
```

To restore templates:
```bash
docker cp ./backup/user_templates.pkl gradeloop-keystroke-service:/app/models/
```

## Troubleshooting

### Service won't start
```bash
# Check logs
docker compose logs keystroke-service

# Common issues:
# 1. Port 8002 already in use
# 2. Missing dependencies
# 3. Model files not found (service will still start but warn)
```

### Cannot access through API Gateway
```bash
# Check if services can communicate
docker exec gradeloop-api-gateway ping keystroke-service

# Check gateway logs
docker compose logs api-gateway

# Verify network connectivity
docker network inspect infra_gradeloop-net
```

### JWT authentication fails
- Make sure you're using a valid JWT token from the auth service
- Check token expiration
- Verify JWT secret matches across services

## Performance Considerations

- **CPU Mode**: Current configuration uses CPU for inference
- **GPU Mode**: To enable GPU:
  1. Update Dockerfile to use CUDA base image
  2. Set `DEVICE=cuda` in docker-compose.yml
  3. Add GPU support to Docker Compose

- **Scalability**: 
  - Service is stateless (except in-memory sessions)
  - Can be scaled horizontally with load balancer
  - For production, move session storage to Redis

## Security

- All endpoints (except health check) require JWT authentication
- API Gateway validates tokens before proxying requests
- Session data is isolated per user
- Templates are persisted securely in Docker volumes

## Next Steps

1. **Production Setup**:
   - Move session storage to Redis
   - Add rate limiting
   - Enable HTTPS
   - Configure proper CORS

2. **Monitoring**:
   - Add Prometheus metrics
   - Configure logging aggregation
   - Set up alerts for high risk scores

3. **Testing**:
   - Add integration tests
   - Load testing
   - Security testing

## References

- [Keystroke Service README](../../services/python/keystroke-service/README.md)
- [API Gateway Documentation](../../docs/api-gateway-implementation.md)
- [Architecture Overview](../../docs/architecture.md)
