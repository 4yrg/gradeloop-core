package main

import (
	"log"
	"os"
	"time"

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
	gormLogger "gorm.io/gorm/logger"
)

func main() {
	// 0. Load .env with robust path searching
	_ = godotenv.Load(".env", "../.env", "../../.env", "../../../.env", "../../../../.env", "../../../../../.env")

	// 1. Load Configuration
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("IDENTITY_DATABASE_URL or DATABASE_URL must be set")
	}

	// 2. Setup DB with optimized logger configuration
	newLogger := gormLogger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		gormLogger.Config{
			SlowThreshold:             time.Second,   // Slow SQL threshold increased to 1 second
			LogLevel:                  gormLogger.Warn, // Only log warnings and errors
			IgnoreRecordNotFoundError: true,            // Don't log "record not found" as errors
			ParameterizedQueries:      true,            // Don't include params in SQL log for security
			Colorful:                  true,            // Enable color for better readability
		},
	)
	
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Configure connection pool for better performance
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get underlying sql.DB:", err)
	}

	// Configure connection pool
	sqlDB.SetMaxIdleConns(10)    // Maximum idle connections
	sqlDB.SetMaxOpenConns(100)   // Maximum open connections  
	sqlDB.SetConnMaxLifetime(time.Hour) // Connection max lifetime

	// 3. Setup Components
	repo := repository.NewRepository(db)

	// Auto-Migrate (Dev only)
	if err := repo.AutoMigrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Add performance indexes
	if err := repo.AddPerformanceIndexes(); err != nil {
		log.Printf("Warning: Failed to add some performance indexes: %v", err)
		// Don't fail startup for index creation issues
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
