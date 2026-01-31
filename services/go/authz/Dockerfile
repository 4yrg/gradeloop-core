FROM golang:1.25.6-alpine AS builder

WORKDIR /app

COPY services/go/authz/go.mod services/go/authz/go.sum ./
RUN go mod download

COPY services/go/authz/ .

RUN CGO_ENABLED=1 GOOS=linux go build -o authz-service cmd/server/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/authz-service .
RUN apk add --no-cache sqlite-libs

CMD ["./authz-service"]
