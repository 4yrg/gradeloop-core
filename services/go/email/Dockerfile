FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN apk add --no-cache build-base
RUN go mod download

COPY . .

# Build the binary
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o server cmd/main.go

FROM alpine:latest

WORKDIR /app

# Install runtime dependencies (check if needed for sqlite, usually static linking handles it, but ca-certificates good for SMTP)
RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/server .

# Expose port (5005 as per updated main.go)
EXPOSE 5005

CMD ["./server"]
