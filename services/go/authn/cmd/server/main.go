package main

import (
	"log"

	"github.com/4yrg/gradeloop-core/services/go/authn/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/authn/internal/config"
	"github.com/4yrg/gradeloop-core/services/go/authn/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 1. Config
	cfg := config.Load()

	// 2. Service
	svc := service.NewAuthNService(cfg)
	handler := api.NewAuthNHandler(svc)

	// 3. Server
	app := fiber.New()
	app.Use(logger.New())

	handler.RegisterRoutes(app)

	log.Printf("AuthN service starting on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
