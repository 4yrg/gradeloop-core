FROM golang:1.25.5-alpine AS builder

WORKDIR /app

# Copy shared module
COPY shared ./shared

# Copy api-gateway module into its own directory
COPY api-gateway ./api-gateway

# Change to api-gateway directory and download dependencies
WORKDIR /app/api-gateway
RUN go mod download

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o api-gateway ./cmd/main.go

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/api-gateway/api-gateway .

# Expose ports
EXPOSE 8080

CMD ["./api-gateway"]
