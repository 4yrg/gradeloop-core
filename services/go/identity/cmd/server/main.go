package main

import (
	"log"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/config"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 0. Load .env with robust path searching
	_ = godotenv.Load(".env", "../.env", "../../.env", "../../../.env", "../../../../.env", "../../../../../.env")

	// 1. Load Configuration
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("IDENTITY_DATABASE_URL or DATABASE_URL must be set")
	}

	// 2. Setup DB
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 3. Setup Components
	repo := repository.NewRepository(db)

	// Auto-Migrate (Dev only)
	if err := repo.AutoMigrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	svc := service.NewIdentityService(repo, cfg)
	handler := api.NewHandler(svc)

	// 4. Setup Fiber
	app := fiber.New()
	app.Use(logger.New())
	app.Use(recover.New())

	api.SetupRoutes(app, handler)

	// 5. Start
	log.Printf("Identity Service running on :%s", cfg.Port)
	log.Printf("Email Service URL: %s", cfg.EmailServiceURL)
	log.Fatal(app.Listen(":" + cfg.Port))
}
