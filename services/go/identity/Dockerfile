# syntax=docker/dockerfile:1

################################################################################
# Create a stage for building the application.
ARG GO_VERSION=1.25.5
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /src

# Copy libs first as it's a dependency
COPY libs /src/libs
COPY services/go/identity/go.mod services/go/identity/go.sum /src/services/go/identity/

WORKDIR /src/services/go/identity

# Install dependencies
RUN apk add --no-cache git
RUN --mount=type=cache,target=/go/pkg/mod/ \
    go mod download -x

# Build the application
# Leverage a bind mount to the root directory to find both libs and service source.
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=.,target=/src \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /bin/main ./cmd/server/main.go

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

# Expose port
EXPOSE 8080

# Run the application
CMD ["/app/main"]
