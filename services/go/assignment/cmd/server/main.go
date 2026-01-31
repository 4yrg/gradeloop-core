package main

import (
	"log"
	"os"

	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Setup DB
	dsn := os.Getenv("ASSIGNMENT_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		log.Fatal("ASSIGNMENT_DATABASE_URL or DATABASE_URL must be set")
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

	svc := service.NewAssignmentService(repo)
	handler := api.NewHandler(svc)

	// 3. Setup Fiber
	app := fiber.New()
	app.Use(logger.New())
	app.Use(recover.New())

	api.SetupRoutes(app, handler)

	// 4. Start
	port := os.Getenv("PORT")
	if port == "" {
		port = "8005"
	}
	log.Printf("Assignment Service running on :%s", port)
	log.Fatal(app.Listen(":" + port))
}
