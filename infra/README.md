# Infrastructure

This directory contains Infrastructure as Code (IaC) and deployment configurations.

## Structure

```
infra/
├── docker/
│   └── docker-compose.yml     # Docker Compose for local development
├── kubernetes/
│   ├── base/                  # Base Kubernetes manifests
│   └── overlays/              # Environment-specific overlays (dev, staging, prod)
└── terraform/                 # Terraform configurations for cloud infrastructure
```

## Docker

### docker-compose.yml

The main Docker Compose file for local development. It includes:
- All microservices
- API Gateway (Traefik)
- Databases (PostgreSQL, Redis)
- Development tools

#### Usage

```bash
# Start all services
cd infra/docker
docker-compose up

# Start specific service
docker-compose up web auth-service

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

#### Environment Variables

Copy `.env.example` to `.env` in the project root and configure:
- Database credentials
- JWT secrets
- OAuth credentials
- Service URLs

## Kubernetes

Kubernetes manifests for deploying to production clusters.

### Structure

```
kubernetes/
├── base/                      # Base configurations (Kustomize)
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── deployments/
│   ├── services/
│   └── ingress/
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

### Deployment

```bash
# Apply base configuration
kubectl apply -k kubernetes/base

# Apply environment-specific overlay
kubectl apply -k kubernetes/overlays/prod

# Check deployment status
kubectl get pods -n gradeloop
kubectl get services -n gradeloop
```

### Best Practices

- Use **namespaces** to isolate environments
- Implement **resource limits** and requests
- Configure **health checks** (liveness, readiness)
- Use **ConfigMaps** for configuration
- Use **Secrets** for sensitive data
- Implement **horizontal pod autoscaling**
- Set up **ingress** with TLS

## Terraform

Infrastructure provisioning for cloud resources.

### Structure

```
terraform/
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   └── redis/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
└── backend.tf
```

### Usage

```bash
cd terraform/environments/prod

# Initialize
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy
```

### Managed Resources

- **VPC**: Virtual Private Cloud
- **EKS**: Elastic Kubernetes Service
- **RDS**: Managed PostgreSQL
- **ElastiCache**: Managed Redis
- **S3**: Object storage
- **CloudFront**: CDN
- **Route53**: DNS
- **ACM**: SSL certificates

## CI/CD Integration

Infrastructure is managed through CI/CD pipelines:

1. **Pull Request**: `terraform plan` runs automatically
2. **Merge to main**: `terraform apply` runs for dev environment
3. **Tagged Release**: Deploys to staging, then production with approval

## Security

- Store secrets in AWS Secrets Manager or HashiCorp Vault
- Use IAM roles for service authentication
- Enable encryption at rest and in transit
- Implement network policies
- Regular security audits

## Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Loki**: Log aggregation
- **Jaeger**: Distributed tracing
- **AlertManager**: Alerting

## Disaster Recovery

- Regular database backups
- Multi-AZ deployments
- Automated failover
- Backup retention policies
- Disaster recovery runbooks

## Cost Optimization

- Right-size instances
- Use spot instances for non-critical workloads
- Implement auto-scaling
- Clean up unused resources
- Monitor and optimize costs regularly
