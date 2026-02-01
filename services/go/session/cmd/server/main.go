package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/session/internal/api"
	"github.com/4yrg/gradeloop-core/services/go/session/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/session/internal/repository/redis"
	sqliteRepo "github.com/4yrg/gradeloop-core/services/go/session/internal/repository/sqlite"
	"github.com/4yrg/gradeloop-core/services/go/session/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	goredis "github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Configuration
	sessionTTL := 24 * time.Hour          // Default session TTL
	refreshTokenTTL := 7 * 24 * time.Hour // Default refresh token TTL
	sqlitePath := os.Getenv("SQLITE_PATH")
	if sqlitePath == "" {
		sqlitePath = "session.db"
	}
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	redisUsername := os.Getenv("REDIS_USERNAME")
	if redisUsername == "" {
		redisUsername = "default"
	}
	redisDB := 0
	if dbStr := os.Getenv("REDIS_DB"); dbStr != "" {
		var i int
		if _, err := fmt.Sscanf(dbStr, "%d", &i); err == nil {
			redisDB = i
		}
	}

	// 1. Initialize DB
	dsn := os.Getenv("SESSION_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		log.Fatal("SESSION_DATABASE_URL or DATABASE_URL must be set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(&core.Session{}); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// 2. Initialize Redis
	rdb := goredis.NewClient(&goredis.Options{
		Addr:     redisAddr,
		Username: redisUsername,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       redisDB,
	})

	// 3. Initialize Repositories
	sessionRepo := sqliteRepo.NewSessionRepository(db)
	sessionCache := redis.NewSessionCache(rdb)

	// 4. Initialize Service
	sessionService := service.NewSessionService(sessionRepo, sessionCache, sessionTTL, refreshTokenTTL)

	// 5. Initialize Fiber
	app := fiber.New()
	app.Use(logger.New())

	handler := api.NewHandler(sessionService)
	api.RegisterRoutes(app, handler)

	// 6. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}
	log.Printf("Session Service starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
