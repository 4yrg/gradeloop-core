# GradeLoop API Gateway Architecture

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Clients                             │
│  (Web App, Mobile App, Admin Dashboard)                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS (Port 443)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Traefik API Gateway                             │
│                      (gradeloop-network)                             │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Entry Points                                                 │   │
│  │  • Port 80  (HTTP)  → Redirect to HTTPS                     │   │
│  │  • Port 443 (HTTPS) → Main entry point                      │   │
│  │  • Port 8082        → Prometheus metrics                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Middleware Chain                                             │   │
│  │  1. CORS Headers                                             │   │
│  │  2. Security Headers (HSTS, CSP, X-Frame-Options)           │   │
│  │  3. ForwardAuth → auth-service:8080/internal/auth/validate  │   │
│  │  4. Role-Based Access Control                               │   │
│  │  5. Rate Limiting (per role)                                │   │
│  │  6. Compression                                              │   │
│  │  7. Circuit Breaker                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Routers (Path-based)                                         │   │
│  │  • /api/auth/*       → auth-service                         │   │
│  │  • /api/system/*     → system-admin                         │   │
│  │  • /api/institute/*  → institute-admin                      │   │
│  │  • /api/instructor/* → instructor                           │   │
│  │  • /api/student/*    → student                              │   │
│  │  • /health           → health-service                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────┬───────────────────────────────────────────┬─────┘
                    │                                           │
                    │ Internal Docker Network                   │
                    │ (gradeloop-network)                       │
                    │                                           │
        ┌───────────┴──────────┬────────────────────────────────┴──────┐
        │                      │                                        │
        ▼                      ▼                                        ▼
┌──────────────┐      ┌──────────────┐                        ┌──────────────┐
│ auth-service │      │ system-admin │      ...               │   student    │
│   :8080      │      │   :8080      │                        │   :8080      │
└──────────────┘      └──────────────┘                        └──────────────┘
```

## Authentication Flow

```
┌──────────┐                                                    ┌──────────┐
│          │  1. Request with JWT                               │          │
│  Client  │ ──────────────────────────────────────────────────>│ Traefik  │
│          │                                                     │          │
└──────────┘                                                     └────┬─────┘
                                                                      │
                                                                      │ 2. ForwardAuth
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │              │
                                                               │ auth-service │
                                                               │  /internal/  │
                                                               │  auth/       │
                                                               │  validate    │
                                                               │              │
                                                               └──────┬───────┘
                                                                      │
                                    ┌─────────────────────────────────┴──────────────────┐
                                    │                                                    │
                                    │ 3a. Valid (200)                3b. Invalid (401)  │
                                    │ Returns headers:                                  │
                                    │  • X-User-Id                                      │
                                    │  • X-User-Role                                    │
                                    │  • X-Institute-Id                                 │
                                    │                                                    │
                                    ▼                                                    ▼
                             ┌──────────────┐                                    ┌──────────┐
                             │              │                                    │          │
                             │ Role Check   │                                    │  Reject  │
                             │ Rate Limit   │                                    │  401/403 │
                             │              │                                    │          │
                             └──────┬───────┘                                    └──────────┘
                                    │
                                    │ 4. Forward to backend
                                    │    with user headers
                                    │
                                    ▼
                             ┌──────────────┐
                             │              │
                             │   Backend    │
                             │   Service    │
                             │              │
                             └──────────────┘
```

## Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      Rate Limit Middleware                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Check X-User-Role header
                              │
              ┌───────────────┼───────────────┬──────────────┐
              │               │               │              │
              ▼               ▼               ▼              ▼
      ┌──────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
      │  Student │    │Instructor│   │  Admin   │   │   Auth   │
      │          │    │          │   │          │   │          │
      │ 100/min  │    │ 200/min  │   │ 500/min  │   │  10/min  │
      │ burst:200│    │ burst:400│   │burst:1000│   │ burst:20 │
      └──────────┘    └──────────┘   └──────────┘   └──────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                       │
│  • HTTPS only (HTTP redirects)                                  │
│  • TLS 1.2+ with Let's Encrypt                                  │
│  • HSTS with 1-year max-age                                     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Request Validation                                     │
│  • CORS policy enforcement                                      │
│  • Request size limits (10MB)                                   │
│  • Security headers (CSP, X-Frame-Options, etc.)                │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Authentication                                         │
│  • JWT validation via ForwardAuth                               │
│  • Token expiry check                                           │
│  • User context extraction                                      │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Authorization                                          │
│  • Role-based access control                                    │
│  • Path-based permissions                                       │
│  • Institute-level isolation                                    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: Rate Limiting                                          │
│  • Per-user rate limits                                         │
│  • Role-based quotas                                            │
│  • Burst protection                                             │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 6: Service Resilience                                     │
│  • Circuit breaker                                              │
│  • Health checks                                                │
│  • Retry logic                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Observability Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      Traefik API Gateway                         │
└───────────┬─────────────────────────────┬───────────────────────┘
            │                             │
            │ Metrics                     │ Logs
            │ (Prometheus format)         │ (JSON)
            │                             │
            ▼                             ▼
    ┌──────────────┐            ┌──────────────────┐
    │              │            │                  │
    │  Prometheus  │            │  logs/access.log │
    │   :8082      │            │  logs/traefik.log│
    │              │            │                  │
    └──────┬───────┘            └────────┬─────────┘
           │                             │
           │                             │
           ▼                             ▼
    ┌──────────────┐            ┌──────────────────┐
    │              │            │                  │
    │   Grafana    │            │  Log Aggregator  │
    │  (Dashboards)│            │  (ELK, Loki)     │
    │              │            │                  │
    └──────────────┘            └──────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Production Environment                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Docker Host                                                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ gradeloop-network (bridge)                                 │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   Traefik    │  │ auth-service │  │ system-admin │    │ │
│  │  │   Gateway    │  │              │  │              │    │ │
│  │  │              │  │              │  │              │    │ │
│  │  │  Ports:      │  │  Internal    │  │  Internal    │    │ │
│  │  │  80, 443     │  │  :8080       │  │  :8080       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ institute-   │  │ instructor   │  │   student    │    │ │
│  │  │   admin      │  │              │  │              │    │ │
│  │  │              │  │              │  │              │    │ │
│  │  │  Internal    │  │  Internal    │  │  Internal    │    │ │
│  │  │  :8080       │  │  :8080       │  │  :8080       │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Volumes                                                     │ │
│  │  • ./traefik.yml → /etc/traefik/traefik.yml               │ │
│  │  • ./dynamic → /etc/traefik/dynamic                        │ │
│  │  • ./certs → /etc/traefik/certs                            │ │
│  │  • ./logs → /var/log/traefik                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration File Relationships

```
api-gateway/
│
├── docker-compose.yml ──────────┐
│                                │ References
│                                ▼
├── traefik.yml ─────────> Static Config
│   • Entry points              (Loaded at startup)
│   • Providers
│   • Logging
│   • Metrics
│
├── dynamic/ ─────────────> Dynamic Config
│   │                           (Hot-reloadable)
│   │
│   ├── routers.yml ──────> Path matching
│   │                       Service selection
│   │                       Middleware chains
│   │
│   ├── services.yml ─────> Backend URLs
│   │                       Health checks
│   │                       Load balancing
│   │
│   └── middlewares.yml ──> ForwardAuth
│                           CORS
│                           Rate limiting
│                           Security headers
│
├── certs/ ───────────────> TLS certificates
│   └── acme.json            (Auto-managed)
│
└── logs/ ───────────────> Observability
    ├── access.log           (Request logs)
    └── traefik.log          (System logs)
```
