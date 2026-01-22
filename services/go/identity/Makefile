.PHONY: help build run test test-unit test-integration clean deps migrate

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

deps: ## Install dependencies
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

build: ## Build the application
	@echo "Building application..."
	go build -o bin/identity-service cmd/server/main.go

run: ## Run the application
	@echo "Running application..."
	go run cmd/server/main.go

dev: ## Run with auto-reload (requires air)
	@echo "Running in development mode..."
	air

test: ## Run all tests
	@echo "Running all tests..."
	go test ./... -v

test-unit: ## Run unit tests only
	@echo "Running unit tests..."
	go test ./tests/unit/... -v

test-integration: ## Run integration tests only
	@echo "Running integration tests..."
	go test ./tests/integration/... -v

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf bin/
	rm -f identity.db
	rm -f coverage.out coverage.html

fmt: ## Format code
	@echo "Formatting code..."
	go fmt ./...

lint: ## Run linter (requires golangci-lint)
	@echo "Running linter..."
	golangci-lint run

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t identity-service:latest .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 8080:8080 --env-file .env identity-service:latest
