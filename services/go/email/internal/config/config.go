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
	RabbitMQ    RabbitMQConfig
	Logging     LoggingConfig
	SMTP        SMTPConfig
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

type RabbitMQConfig struct {
	URL      string
	Exchange string
	Queue    string
}

type LoggingConfig struct {
	Level string
}

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Server: ServerConfig{
			Port:     getEnv("SERVER_PORT", "8081"),
			GrpcPort: getEnv("GRPC_PORT", "50053"), // Distinct port
			Host:     getEnv("SERVER_HOST", "0.0.0.0"),
		},
		Database: DatabaseConfig{
			Driver:     getEnv("DB_DRIVER", "sqlite"),
			Host:       getEnv("DB_HOST", "localhost"),
			Port:       getEnvAsInt("DB_PORT", 5432),
			User:       getEnv("DB_USER", "postgres"),
			Password:   getEnv("DB_PASSWORD", "postgres"),
			Name:       getEnv("DB_NAME", "email_db"),
			SSLMode:    getEnv("DB_SSLMODE", "disable"),
			SQLitePath: getEnv("SQLITE_PATH", "./email.db"),
		},
		RabbitMQ: RabbitMQConfig{
			URL:      getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
			Exchange: getEnv("RABBITMQ_EXCHANGE", "email_exchange"),
			Queue:    getEnv("RABBITMQ_QUEUE", "email_queue"),
		},
		Logging: LoggingConfig{
			Level: getEnv("LOG_LEVEL", "info"),
		},
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST", "localhost"),
			Port:     getEnvAsInt("SMTP_PORT", 1025), // Default to mailpit/mailhog port
			Username: getEnv("SMTP_USERNAME", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "no-reply@gradeloop.com"),
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
