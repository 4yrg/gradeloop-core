FROM golang:1.25.6-alpine AS builder

WORKDIR /app

COPY services/go/authn/go.mod services/go/authn/go.sum ./
RUN go mod download

COPY services/go/authn/ .

RUN CGO_ENABLED=0 GOOS=linux go build -o authn-service cmd/server/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/authn-service .

CMD ["./authn-service"]
