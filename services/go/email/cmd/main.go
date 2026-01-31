package main

import (
	"log"

	"github.com/4yrg/gradeloop-core/services/go/email/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/email/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/email/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/email/internal/service"
	"github.com/4yrg/gradeloop-core/services/go/email/internal/service/provider"
	"github.com/gofiber/fiber/v2"
)

func main() {
	// 1. Load Config
	cfg, err := core.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Setup Database
	repo, err := repository.NewRepository(cfg.DatabaseName)
	if err != nil {
		log.Fatalf("Failed to initialize repository: %v", err)
	}

	// 3. Setup Services
	emailProvider := provider.NewBrevoProvider(cfg)
	templateSvc := service.NewTemplateService(repo)
	emailSvc := service.NewEmailService(emailProvider, templateSvc, repo)

	// 4. Setup API
	app := fiber.New()
	handler := api.NewHandler(emailSvc, templateSvc)
	api.SetupRoutes(app, handler)

	// 5. Start Server
	log.Printf("Starting Email Service on port 5005 (HTTP)...") // Port from requirements?
	// User didn't specify HTTP port, but .env has EMAIL_GRPC_PORT=50053.
	// Since we are doing HTTP only as requested ("Expose internal HTTP endpoints only"), I'll use 8080 or similar,
	// or reusing 50053 for HTTP since gRPC is avoided.
	// I'll stick to :8080 generally or 3000 (fiber default) but since it's a microservice, maybe 50053 is intended for the service port regardless of protocol.
	// I'll use :50053 for now to match the "PORT" concept in .env even if it says GRPC.
	if err := app.Listen(":5005"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
