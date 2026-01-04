# GradeLoop - Learning Management System

A modern, microservices-based Learning Management System built for scalability and performance.

## 🏗️ Architecture

GradeLoop follows a microservices architecture with the following components:

- **Frontend**: Next.js 14+ with TypeScript, shadcn/ui, and Tailwind CSS
- **API Gateway**: Traefik v3.6 for routing, load balancing, and security
- **Backend Services**: Go (Fiber) and Python (FastAPI) microservices
- **Databases**: PostgreSQL for relational data, Redis for caching
- **Infrastructure**: Docker, Kubernetes, Terraform

## 📁 Project Structure

```
gradeloop-core/
│
├── web/                       # Frontend (Next.js)
│   ├── app/                   # Next.js App Router
│   ├── components/            # React components
│   ├── features/              # Feature modules
│   ├── public/                # Static assets
│   ├── Dockerfile
│   └── package.json
│
├── api-gateway/               # API Gateway (Traefik)
│   ├── traefik.yml            # Static configuration
│   ├── dynamic/               # Dynamic routing rules
│   ├── certs/                 # SSL certificates
│   └── logs/                  # Access logs
│
├── services/                  # Backend microservices
│   ├── go/                    # Go services (Fiber)
│   │   └── auth-service/      # Authentication & authorization
│   └── python/                # Python services (FastAPI)
│       ├── assignment-service/
│       ├── submission-service/
│       └── grading-service/
│
├── libs/                      # Shared libraries
│   ├── proto/                 # gRPC definitions
│   ├── openapi/               # API contracts
│   ├── utils/                 # Utilities
│   └── observability/         # Logging, metrics, tracing
│
├── infra/                     # Infrastructure as Code
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── kubernetes/
│   │   ├── base/
│   │   └── overlays/
│   └── terraform/
│
├── scripts/                   # Dev & CI/CD scripts
│   ├── build-all.sh
│   ├── test-all.sh
│   └── migrate.sh
│
├── docs/                      # Documentation
│   ├── api-gateway-architecture.md
│   └── architecture.md
│
├── .github/                   # CI/CD workflows
│
├── compose.yaml               # Docker Compose (root convenience)
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Go 1.21+ (for local Go service development)
- Python 3.11+ (for local Python service development)

### Running with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd gradeloop-core

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Navigate to infra/docker and start all services
cd infra/docker
docker-compose up

# Or start specific services
docker-compose up web auth-service
```

The application will be available at:
- Frontend: http://localhost:3000
- API Gateway Dashboard: http://localhost:8080
- Prometheus Metrics: http://localhost:8082

### Running Services Locally

#### Frontend (Web)

```bash
cd web
npm install
npm run dev
```

#### Go Service (Auth)

```bash
cd services/go/auth-service
go mod download
go run cmd/main.go
```

#### Python Service

```bash
cd services/python/assignment-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 🛠️ Development

### Building All Services

```bash
./scripts/build-all.sh
```

### Running Tests

```bash
./scripts/test-all.sh
```

### Database Migrations

```bash
# Run migrations
./scripts/migrate.sh up

# Rollback migrations
./scripts/migrate.sh down
```

### Linting

```bash
# Frontend
cd web
npm run lint

# Go services
cd services/go/auth-service
golangci-lint run

# Python services
cd services/python/assignment-service
flake8 app/
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Gateway Documentation](docs/api-gateway-architecture.md)
- [Services README](services/README.md)
- [Infrastructure README](infra/README.md)
- [Shared Libraries README](libs/README.md)

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting via API Gateway
- HTTPS/TLS encryption
- Secrets management via environment variables
- Regular security audits

## 🧪 Testing

- **Unit Tests**: Jest (Frontend), Go test (Go), pytest (Python)
- **Integration Tests**: Testcontainers
- **E2E Tests**: Playwright
- **API Tests**: Postman/Newman

## 📊 Monitoring & Observability

- **Metrics**: Prometheus
- **Visualization**: Grafana
- **Logging**: Structured logging with JSON format
- **Tracing**: OpenTelemetry + Jaeger
- **Health Checks**: `/health` and `/ready` endpoints

## 🚢 Deployment

### Development

```bash
cd infra/docker
docker-compose up
```

### Staging/Production

```bash
# Using Kubernetes
kubectl apply -k infra/kubernetes/overlays/prod

# Using Terraform
cd infra/terraform/environments/prod
terraform apply
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- **Frontend**: ESLint + Prettier
- **Go**: golangci-lint
- **Python**: flake8 + black
- **Commits**: Conventional Commits

## 📝 License

[Your License Here]

## 👥 Team

[Your Team Information]

## 🔗 Links

- [Documentation](docs/)
- [API Documentation](http://localhost:8080/api/docs)
- [Issue Tracker](https://github.com/your-org/gradeloop-core/issues)
- [Changelog](CHANGELOG.md)
