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
	Services    ServicesConfig
	OAuth       OAuthConfig
	JWT         JWTConfig
	Logging     LoggingConfig
}

type ServerConfig struct {
	Port string
	Host string
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

type ServicesConfig struct {
	IdentityServiceURL string
	SessionServiceURL  string
	EmailServiceURL    string
}

type OAuthConfig struct {
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURL  string
}

type JWTConfig struct {
	Secret    string
	ExpiryStr string
}

type LoggingConfig struct {
	Level string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Server: ServerConfig{
			Port: getEnv("AUTHN_SERVER_PORT", getEnv("SERVER_PORT", "8083")), // Default port to match Docker/Compose
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
		},
		Database: DatabaseConfig{
			Driver:     getEnv("DB_DRIVER", "sqlite"),
			Host:       getEnv("DB_HOST", "localhost"),
			Port:       getEnvAsInt("DB_PORT", 5432),
			User:       getEnv("DB_USER", "postgres"),
			Password:   getEnv("DB_PASSWORD", "postgres"),
			Name:       getEnv("DB_NAME", "authn_db"),
			SSLMode:    getEnv("DB_SSLMODE", "disable"),
			SQLitePath: getEnv("SQLITE_PATH", "./authn.db"),
		},
		Services: ServicesConfig{
			IdentityServiceURL: getEnv("IDENTITY_SERVICE_URL", "localhost:50051"),
			SessionServiceURL:  getEnv("SESSION_SERVICE_URL", "localhost:50052"),
			EmailServiceURL:    getEnv("EMAIL_SERVICE_URL", "localhost:50053"),
		},
		OAuth: OAuthConfig{
			GitHubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
			GitHubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
			GitHubRedirectURL:  getEnv("GITHUB_REDIRECT_URL", "http://localhost:8083/auth/github/callback"),
		},
		JWT: JWTConfig{
			Secret:    getEnv("JWT_SECRET", "supersecretkey"),
			ExpiryStr: getEnv("JWT_EXPIRY", "15m"),
		},
		Logging: LoggingConfig{
			Level: getEnv("LOG_LEVEL", "info"),
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
