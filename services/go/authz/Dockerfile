# syntax=docker/dockerfile:1

################################################################################
# Create a stage for building the application.
ARG GO_VERSION=1.25.5
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

# Copy libs first as it's a dependency
COPY libs /src/libs
COPY services/go/authz/go.mod /src/services/go/authz/
# COPY services/go/authz/vendor /src/services/go/authz/vendor

WORKDIR /src/services/go/authz

# Build the application. Using bind mount for source.
RUN --mount=type=bind,source=.,target=/src \
    CGO_ENABLED=0 GOOS=linux go build -o /bin/main ./cmd/server/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite-libs tzdata

# Create a non-privileged user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

WORKDIR /app

# Create data directory for SQLite with correct permissions
RUN mkdir -p /app/data && chown appuser:appuser /app/data

# Copy binary from builder
COPY --from=builder /bin/main /app/main

USER appuser

# Expose ports: 50051 for gRPC, 8080 for HTTP admin
EXPOSE 50051 8080

# Run the application
CMD ["/app/main"]
