FROM golang:1.25-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache git build-base

# Copy module files
COPY services/go/identity/go.mod services/go/identity/go.sum ./
RUN go mod download

# Copy source
COPY services/go/identity/ .

# Build
RUN go build -o identity-service ./cmd/server/main.go

# Run
CMD ["./identity-service"]
