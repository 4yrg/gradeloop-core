package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment string
	Server      ServerConfig
	Database    DatabaseConfig
	Redis       RedisConfig
	Logging     LoggingConfig
	Auth        AuthConfig
}

type AuthConfig struct {
	PrivateKeyPath string
	ServiceSecrets map[string]string // map[service_id]secret for Day 1 simple auth
}

type ServerConfig struct {
	Port     string
	GrpcPort string
	Host     string
}

type DatabaseConfig struct {
	Driver     string
	Host       string
	Port       int
	User       string
	Password   string
	Name       string
	SSLMode    string
	SQLitePath string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type LoggingConfig struct {
	Level string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Server: ServerConfig{
			Port:     getEnv("AUTHZ_SERVER_PORT", getEnv("SERVER_PORT", "8080")),
			GrpcPort: getEnv("AUTHZ_GRPC_PORT", getEnv("GRPC_PORT", "50051")),
			Host:     getEnv("SERVER_HOST", "0.0.0.0"),
		},
		Database: DatabaseConfig{
			Driver:     getEnv("DB_DRIVER", "sqlite"),
			Host:       getEnv("DB_HOST", "localhost"),
			Port:       getEnvAsInt("DB_PORT", 5432),
			User:       getEnv("DB_USER", "postgres"),
			Password:   getEnv("DB_PASSWORD", "postgres"),
			Name:       getEnv("DB_NAME", "authz_db"),
			SSLMode:    getEnv("DB_SSLMODE", "disable"),
			SQLitePath: getEnv("SQLITE_PATH", "./data/authz.db"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Logging: LoggingConfig{
			Level: getEnv("LOG_LEVEL", "info"),
		},
		Auth: AuthConfig{
			PrivateKeyPath: getEnv("AUTH_PRIVATE_KEY_PATH", "./certs/private_key.pem"),
			ServiceSecrets: map[string]string{
				// In a real app, load these from a secure source or env vars in a loop
				"identity-service": getEnv("SERVICE_SECRET_IDENTITY", "identity-secret-123"),
				"email-service":    getEnv("SERVICE_SECRET_EMAIL", "email-secret-123"),
			},
		},
	}

	return cfg, nil
}

func (c *Config) GetDSN() string {
	if c.Database.Driver == "sqlite" {
		return c.Database.SQLitePath
	}

	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
