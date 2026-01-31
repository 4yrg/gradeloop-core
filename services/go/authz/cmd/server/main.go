package main

import (
	"log"
	"os"

	"github.com/4yrg/gradeloop-core/services/go/authz/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// 1. Config
	port := os.Getenv("PORT")
	if port == "" {
		port = "4001"
	}
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		dbUrl = "authz.db"
	}

	// 2. Database
	db, err := gorm.Open(sqlite.Open(dbUrl), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 3. DI
	repo := repository.NewAuthZRepository(db)
	svc := service.NewAuthZService(repo)
	handler := api.NewAuthZHandler(svc)

	// 4. Init (Migrate + Seed)
	if err := svc.Init(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	// seed defaults in background or only if table empty?
	// For dev simplicity, we'll just try to seed and ignore duplicates (handled by db constraints)
	_ = svc.SeedDefaults()

	// 5. Server
	app := fiber.New()
	app.Use(logger.New())

	handler.RegisterRoutes(app)

	log.Printf("AuthZ service starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
