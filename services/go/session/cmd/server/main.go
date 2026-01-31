package main

import (
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
	"gorm.io/driver/sqlite"
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

	// 1. Initialize SQLite
	db, err := gorm.Open(sqlite.Open(sqlitePath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(&core.Session{}); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// 2. Initialize Redis
	rdb := goredis.NewClient(&goredis.Options{
		Addr: redisAddr,
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
	log.Fatal(app.Listen(":3000"))
}
