package main

import (
	"log"

	"github.com/ansrivas/fiberprometheus/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gradeloop/api-gateway/config"
	"github.com/gradeloop/api-gateway/routes"
	"github.com/gradeloop/api-gateway/services"
)

func main() {
	// Load Config
	cfg := config.LoadConfig()

	// Initialize Fiber App
	app := fiber.New(fiber.Config{
		Prefork:       false,
		CaseSensitive: true,
		StrictRouting: true,
	})

	// Middleware Stack
	app.Use(logger.New()) // Logging

	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://127.0.0.1:3000", // Adjust for production
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
	}))

	// Prometheus Metrics
	prometheus := fiberprometheus.New("api_gateway")
	prometheus.RegisterAt(app, "/metrics")
	app.Use(prometheus.Middleware)

	// Initialize gRPC Clients
	services.InitAuthClient(cfg)

	// Routes
	routes.SetupRoutes(app, cfg)

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Start Server
	log.Printf("API Gateway starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
