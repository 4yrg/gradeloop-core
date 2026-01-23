package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort       string
	GrpcPort      string
	DBDriver      string // sqlite or postgres
	DBDSN         string
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Environment   string
}

func Load() (*Config, error) {
	_ = godotenv.Load() // Load .env file if it exists

	cfg := &Config{
		AppPort:       getEnv("SESSION_SERVER_PORT", getEnv("APP_PORT", "8082")),
		GrpcPort:      getEnv("SESSION_GRPC_PORT", getEnv("GRPC_PORT", "50052")),
		DBDriver:      getEnv("SESSION_DB_DRIVER", getEnv("DB_DRIVER", "sqlite")),
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		Environment:   getEnv("APP_ENV", "development"),
	}

	// Database DSN Setup
	if cfg.DBDriver == "postgres" {
		host := getEnv("DB_HOST", "localhost")
		user := getEnv("DB_USER", "postgres")
		password := getEnv("DB_PASSWORD", "postgres")
		dbname := getEnv("DB_NAME", "session_db")
		port := getEnv("DB_PORT", "5432")
		sslmode := getEnv("DB_SSLMODE", "disable")

		cfg.DBDSN = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			host, user, password, dbname, port, sslmode)
	} else {
		// Default to SQLite
		cfg.DBDSN = getEnv("DB_DSN", "session.db")
	}

	// Redis DB
	redisDBStr := getEnv("REDIS_DB", "0")
	redisDB, err := strconv.Atoi(redisDBStr)
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_DB: %w", err)
	}
	cfg.RedisDB = redisDB

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
