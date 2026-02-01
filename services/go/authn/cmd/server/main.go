package main

import (
	"log"

	"github.com/4yrg/gradeloop-core/services/go/authn/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/authn/internal/config"
	"github.com/4yrg/gradeloop-core/services/go/authn/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	// 0. Load .env
	_ = godotenv.Load(".env", "../.env", "../../.env", "../../../.env", "../../../../.env", "../../../../../.env")

	// 1. Config
	cfg := config.Load()

	// 2. Service
	svc := service.NewAuthNService(cfg)

	// Test Redis connection
	if err := svc.PingRedis(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
	} else {
		log.Println("Redis connected successfully")
	}

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
