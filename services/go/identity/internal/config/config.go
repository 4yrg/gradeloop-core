package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port            string
	DatabaseURL     string
	EmailServiceURL string
	InternalToken   string
	WebURL          string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8001"),
		DatabaseURL:     getEnv("IDENTITY_DATABASE_URL", getEnv("DATABASE_URL", "")),
		EmailServiceURL: getEnv("EMAIL_SERVICE_URL", "http://localhost:5005"),
		InternalToken:   getEnv("INTERNAL_SECRET", "insecure-secret-for-dev"),
		WebURL:          getEnv("WEB_URL", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return fallback
}