package config

import (
	"log"
	"os"
)

type Config struct {
	Port               string
	RedisAddr          string
	IdentityServiceURL string
	SessionServiceURL  string
	EmailServiceURL    string
	AuthZServiceURL    string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "4000"),
		RedisAddr:          getEnv("REDIS_ADDR", "localhost:6379"),
		IdentityServiceURL: getEnv("IDENTITY_SERVICE_URL", "http://localhost:8080"),
		SessionServiceURL:  getEnv("SESSION_SERVICE_URL", "http://localhost:3000"),
		EmailServiceURL:    getEnv("EMAIL_SERVICE_URL", "http://localhost:5005"),
		AuthZServiceURL:    getEnv("AUTHZ_SERVICE_URL", "http://localhost:4001"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	log.Printf("Using default value for %s: %s", key, fallback)
	return fallback
}
