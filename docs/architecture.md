# GradeLoop Architecture

## Overview

GradeLoop is built using a **microservices architecture** to ensure scalability, maintainability, and independent deployment of services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │   Admin UI   │          │
│  │  (Next.js)   │  │  (Flutter)   │  │  (Next.js)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Traefik)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │   Routing  │  │    Auth    │  │Rate Limit  │                │
│  │Load Balance│  │   Proxy    │  │   & CORS   │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Auth Service  │    │User Service  │    │Course Service│
│   (Go)       │    │   (Go)       │    │   (Python)   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Assignment    │    │Submission    │    │Grading       │
│Service (Py)  │    │Service (Py)  │    │Service (Py)  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                    │
        └───────────────────┴────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │         Data Layer                    │
        │  ┌──────────┐  ┌──────────┐          │
        │  │PostgreSQL│  │  Redis   │          │
        │  │  (Main)  │  │ (Cache)  │          │
        │  └──────────┘  └──────────┘          │
        └───────────────────────────────────────┘
```

## Core Principles

### 1. Microservices

Each service is:
- **Independent**: Can be developed, deployed, and scaled independently
- **Focused**: Single responsibility principle
- **Resilient**: Failure in one service doesn't bring down the entire system
- **Technology Agnostic**: Services can use different tech stacks

### 2. API Gateway Pattern

The API Gateway (Traefik) provides:
- **Single Entry Point**: All client requests go through the gateway
- **Routing**: Routes requests to appropriate services
- **Authentication**: Centralized auth validation
- **Rate Limiting**: Prevents abuse
- **Load Balancing**: Distributes traffic across service instances
- **SSL Termination**: Handles HTTPS

### 3. Database per Service

Each service has its own database:
- **Data Isolation**: Services don't share databases
- **Independent Scaling**: Scale databases based on service needs
- **Technology Choice**: Use the best database for each service
- **Loose Coupling**: Changes in one database don't affect others

### 4. Event-Driven Communication

Services communicate via:
- **Synchronous**: HTTP/REST for immediate responses
- **Asynchronous**: Message queues (Redis Pub/Sub, RabbitMQ) for background tasks
- **gRPC**: For high-performance inter-service communication

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod

### API Gateway
- **Technology**: Traefik v3.6
- **Features**: Routing, Load Balancing, SSL, Metrics
- **Configuration**: YAML-based

### Backend Services

#### Go Services (Fiber Framework)
- **Auth Service**: JWT authentication, user sessions
- **User Service**: User management, profiles

**Why Go?**
- High performance
- Low memory footprint
- Excellent concurrency
- Fast startup time

#### Python Services (FastAPI Framework)
- **Assignment Service**: Assignment CRUD, templates
- **Submission Service**: File handling, plagiarism detection
- **Grading Service**: Auto-grading, rubrics

**Why Python?**
- Rich ecosystem for ML/AI
- Excellent for data processing
- Fast development
- Great for academic algorithms

### Databases
- **PostgreSQL**: Primary relational database
- **Redis**: Caching, session storage, pub/sub

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Service Communication

### Synchronous (HTTP/REST)

```
Client → API Gateway → Service → Database
                    ↓
                Response
```

### Asynchronous (Message Queue)

```
Service A → Message Queue → Service B
                ↓
          (Background Processing)
```

### gRPC (Inter-Service)

```
Service A ←→ Service B
   (gRPC)
```

## Data Flow Example: Submitting an Assignment

1. **Student** uploads assignment via **Web App**
2. **API Gateway** authenticates request and routes to **Submission Service**
3. **Submission Service**:
   - Validates file
   - Stores file in object storage
   - Creates submission record in database
   - Publishes "submission.created" event to message queue
4. **Grading Service** (subscribed to queue):
   - Receives event
   - Runs auto-grading
   - Updates submission with grade
   - Publishes "submission.graded" event
5. **Notification Service**:
   - Receives event
   - Sends notification to student

## Security Architecture

### Authentication Flow

```
1. User logs in → Auth Service
2. Auth Service validates credentials
3. Auth Service generates JWT token
4. Client stores JWT token
5. Client sends JWT with each request
6. API Gateway validates JWT
7. Request forwarded to service with user context
```

### Authorization

- **Role-Based Access Control (RBAC)**
  - Roles: Student, Instructor, Admin
  - Permissions: Read, Write, Delete
- **Service-Level Authorization**
  - Each service validates user permissions
  - Centralized permission definitions

### Security Measures

- JWT tokens with expiration
- HTTPS/TLS encryption
- Rate limiting
- CORS policies
- Input validation
- SQL injection prevention
- XSS protection

## Scalability

### Horizontal Scaling

Services can be scaled independently:

```bash
# Scale submission service to 5 instances
kubectl scale deployment submission-service --replicas=5
```

### Database Scaling

- **Read Replicas**: For read-heavy services
- **Sharding**: For large datasets
- **Caching**: Redis for frequently accessed data

### Load Balancing

Traefik automatically load balances across service instances.

## Resilience

### Health Checks

Each service exposes:
- `/health`: Basic health check
- `/ready`: Readiness check (dependencies ready)

### Circuit Breaker

Prevents cascading failures:
- If service fails repeatedly, circuit opens
- Requests fail fast instead of timing out
- Circuit closes after recovery period

### Retry Logic

- Automatic retries for transient failures
- Exponential backoff
- Maximum retry limits

### Graceful Degradation

- Non-critical features can fail without breaking core functionality
- Fallback responses when services are unavailable

## Observability

### Logging

- **Structured Logging**: JSON format
- **Correlation IDs**: Track requests across services
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL

### Metrics

- **Application Metrics**: Request count, duration, errors
- **Business Metrics**: Submissions, grades, active users
- **Infrastructure Metrics**: CPU, memory, disk

### Tracing

- **Distributed Tracing**: OpenTelemetry + Jaeger
- **Trace Requests**: Across all services
- **Performance Analysis**: Identify bottlenecks

## Development Workflow

1. **Local Development**: Docker Compose
2. **Feature Branch**: Create branch, develop, test
3. **Pull Request**: Code review, automated tests
4. **Merge**: Deploy to dev environment
5. **Staging**: Integration testing
6. **Production**: Gradual rollout with monitoring

## Deployment Strategy

### Blue-Green Deployment

- Two identical environments (Blue, Green)
- Deploy to inactive environment
- Switch traffic after validation
- Instant rollback if issues

### Canary Deployment

- Deploy to small subset of users
- Monitor metrics
- Gradually increase traffic
- Rollback if issues detected

## Future Enhancements

- [ ] GraphQL API Gateway
- [ ] Service Mesh (Istio)
- [ ] Event Sourcing
- [ ] CQRS Pattern
- [ ] Multi-region deployment
- [ ] Advanced analytics
- [ ] Machine learning integration
- [ ] Real-time collaboration features

## References

- [Microservices Patterns](https://microservices.io/patterns/)
- [Twelve-Factor App](https://12factor.net/)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Database per Service](https://microservices.io/patterns/data/database-per-service.html)
