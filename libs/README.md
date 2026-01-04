# Shared Libraries

This directory contains shared code, contracts, and utilities used across multiple services.

## Structure

```
libs/
├── proto/                 # Protocol Buffers / gRPC definitions
├── openapi/               # OpenAPI/Swagger specifications
├── utils/                 # Language-agnostic utilities
└── observability/         # Logging, metrics, tracing configs
```

## Proto (gRPC)

Contains Protocol Buffer definitions for inter-service communication.

```
proto/
├── auth/
│   └── auth.proto
├── user/
│   └── user.proto
└── common/
    └── types.proto
```

### Usage

```bash
# Generate Go code
protoc --go_out=. --go-grpc_out=. proto/**/*.proto

# Generate Python code
python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. proto/**/*.proto
```

## OpenAPI

API contract specifications for all services.

```
openapi/
├── auth-service.yaml
├── user-service.yaml
└── common/
    └── schemas.yaml
```

### Benefits
- **Contract-First Development**: Define APIs before implementation
- **Auto-Generated Docs**: Swagger UI documentation
- **Client Generation**: Generate client SDKs
- **Validation**: Request/response validation

## Utils

Language-agnostic utilities and scripts.

```
utils/
├── scripts/
│   ├── generate-certs.sh
│   ├── db-backup.sh
│   └── health-check.sh
└── templates/
    └── service-template/
```

## Observability

Shared configuration for logging, metrics, and tracing.

```
observability/
├── logging/
│   ├── log-config.json
│   └── log-format.json
├── metrics/
│   └── prometheus.yml
└── tracing/
    └── jaeger-config.yaml
```

### Logging Standards

All services should use structured logging with these fields:
- `timestamp`: ISO 8601 format
- `level`: DEBUG, INFO, WARN, ERROR, FATAL
- `service`: Service name
- `trace_id`: Distributed tracing ID
- `message`: Log message
- `context`: Additional context (JSON object)

### Metrics

Standard metrics to expose:
- Request count
- Request duration
- Error rate
- Active connections
- Custom business metrics

### Tracing

Use OpenTelemetry for distributed tracing across services.

## Best Practices

1. **Versioning**: Version your proto files and OpenAPI specs
2. **Backward Compatibility**: Don't break existing contracts
3. **Documentation**: Document all shared utilities
4. **Testing**: Test shared code thoroughly
5. **Reusability**: Make code truly reusable, not service-specific

## Adding New Shared Code

1. Determine the appropriate subdirectory
2. Follow existing naming conventions
3. Add documentation
4. Update this README
5. Notify teams using the affected services
