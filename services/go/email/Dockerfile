# syntax=docker/dockerfile:1

################################################################################
# Create a stage for building the application.
ARG GO_VERSION=1.25.5
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION} AS build
WORKDIR /src

# Copy libs first as it's a dependency
COPY libs /src/libs
COPY services/go/email/go.mod services/go/email/go.sum /src/services/go/email/

WORKDIR /src/services/go/email

# Download dependencies
RUN --mount=type=cache,target=/go/pkg/mod/ \
    go mod download -x

# Build the application.
ARG TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=.,target=/src \
    CGO_ENABLED=0 GOARCH=$TARGETARCH go build -o /bin/server ./cmd/server

################################################################################
# Runtime stage
FROM alpine:latest AS final

RUN --mount=type=cache,target=/var/cache/apk \
    apk --update add \
    ca-certificates \
    tzdata \
    && \
    update-ca-certificates

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

# Create data directory for SQLite with correct permissions
RUN mkdir -p /app/data && chown appuser:appuser /app/data

USER appuser

# Copy the executable from the "build" stage.
COPY --from=build /bin/server /bin/

# Expose the port that the application listens on.
EXPOSE 8081

# What the container should run when it is started.
ENTRYPOINT [ "/bin/server" ]
