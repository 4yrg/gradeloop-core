FROM golang:1.25.5-alpine AS builder

WORKDIR /app

# Copy shared module
COPY shared ./shared

# Copy auth-service module into its own directory
COPY auth-service ./auth-service

# Change to auth-service directory and download dependencies
WORKDIR /app/auth-service
RUN go mod download

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o auth-service .

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/auth-service/auth-service .

EXPOSE 8080

CMD ["./auth-service"]
