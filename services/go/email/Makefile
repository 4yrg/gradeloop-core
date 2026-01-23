.PHONY: run dev test build clean

run:
	go run cmd/server/main.go

dev:
	air

test:
	go test ./...

build:
	go build -o bin/server cmd/server/main.go

clean:
	rm -rf bin/ email.db
