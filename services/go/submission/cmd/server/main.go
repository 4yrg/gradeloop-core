package main

import (
	"log"
	"os"

	"github.com/4yrg/gradeloop-core/services/go/submission/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/service"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Setup DB
	dsn := os.Getenv("SUBMISSION_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		log.Fatal("SUBMISSION_DATABASE_URL or DATABASE_URL must be set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 2. Setup Components
	repo := repository.NewRepository(db)

	// Auto-Migrate
	if err := repo.AutoMigrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize storage client
	storageClient, err := storage.NewSupabaseStorage()
	if err != nil {
		log.Printf("Warning: Failed to initialize Supabase storage: %v. File uploads may fail.", err)
		// We don't fatal here to allow the service to start even if storage config is missing during dev
		// In production, you might want to fatal error
	}

	svc := service.NewSubmissionService(repo, storageClient)
	handler := api.NewHandler(svc)

	// 3. Setup Fiber
	app := fiber.New()
	app.Use(logger.New())
	app.Use(recover.New())

	api.SetupRoutes(app, handler)

	// 4. Start
	port := os.Getenv("PORT")
	if port == "" {
		port = "8006"
	}
	log.Printf("Submission Service running on :%s", port)
	log.Fatal(app.Listen(":" + port))
}
