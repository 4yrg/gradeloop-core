FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN apk add --no-cache build-base
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o server cmd/server/main.go

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/server .

CMD ["./server"]
