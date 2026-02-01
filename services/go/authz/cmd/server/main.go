package main

import (
	"log"
	"os"

	"time"

	"github.com/4yrg/gradeloop-core/services/go/authz/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

func main() {
	// 1. Config
	port := os.Getenv("PORT")
	if port == "" {
		port = "8004"
	}
	dsn := os.Getenv("AUTHZ_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		log.Fatal("AUTHZ_DATABASE_URL or DATABASE_URL must be set")
	}

	// Quiet Logger for Startup
	newLogger := gormLogger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		gormLogger.Config{
			SlowThreshold:             500 * time.Millisecond, // Slow SQL threshold
			LogLevel:                  gormLogger.Warn,        // Log level
			IgnoreRecordNotFoundError: true,                   // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      true,                   // Don't include params in the SQL log
			Colorful:                  true,                   // Disable color
		},
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})
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
