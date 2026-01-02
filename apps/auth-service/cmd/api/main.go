package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gradeloop/auth-service/internal/config"
	"github.com/gradeloop/auth-service/internal/db"
	"github.com/gradeloop/auth-service/internal/handlers"
	"github.com/gradeloop/auth-service/internal/service"
)

func main() {
	// Load Configuration
	cfg := config.Load()

	// Connect to Database
	database, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migrate is called within Connect or separately
	// Seeding is called here
	// Seeding is called here
	seedUsers(database)

	// Initialize Fiber
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New())

	// Initialize Services & Handlers
	authService := service.NewAuthService(database, cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authService)

	// Routes
	api := app.Group("/api/auth")
	api.Post("/login", authHandler.Login)
	api.Post("/register", authHandler.Register)
	api.Get("/me", authHandler.Me) // Middleware needed

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}
