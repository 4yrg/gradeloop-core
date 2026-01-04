# Go Services

Go-based microservices using the Fiber framework.

## Services

### auth-service
Authentication and authorization service (to be implemented).

## Adding a New Go Service

1. Create service directory:
```bash
mkdir -p services/go/service-name
cd services/go/service-name
```

2. Initialize Go module:
```bash
go mod init github.com/your-org/gradeloop-core/services/go/service-name
```

3. Create directory structure:
```bash
mkdir -p cmd internal/{handlers,models,repository,services,middleware} pkg tests
```

4. Create main.go:
```go
package main

import (
    "log"
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()
    
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"status": "healthy"})
    })
    
    log.Fatal(app.Listen(":8080"))
}
```

5. Add dependencies:
```bash
go get github.com/gofiber/fiber/v2
```

6. Create Dockerfile
7. Add to infra/docker/docker-compose.yml
8. Update API Gateway routing

## Best Practices

- Use dependency injection
- Implement interfaces for testability
- Use context for request scoping
- Implement proper error handling
- Add comprehensive logging
- Write unit and integration tests
