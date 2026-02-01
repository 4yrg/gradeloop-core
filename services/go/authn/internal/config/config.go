package config

import (
	"fmt"
	"log"
	"os"
)

type Config struct {
	Port               string
	RedisAddr          string
	RedisPassword      string
	RedisUsername      string
	RedisDB            int
	IdentityServiceURL string
	SessionServiceURL  string
	EmailServiceURL    string
	AuthZServiceURL    string
	InternalToken      string
	WebURL             string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8003"),
		RedisAddr:          getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:      getEnv("REDIS_PASSWORD", ""),
		RedisUsername:      getEnv("REDIS_USERNAME", "default"),
		RedisDB:            getEnvInt("REDIS_DB", 0),
		IdentityServiceURL: getEnv("IDENTITY_SERVICE_URL", "http://localhost:8001"),
		SessionServiceURL:  getEnv("SESSION_SERVICE_URL", "http://localhost:8002"),
		EmailServiceURL:    getEnv("EMAIL_SERVICE_URL", "http://localhost:5005"),
		AuthZServiceURL:    getEnv("AUTHZ_SERVICE_URL", "http://localhost:8004"),
		InternalToken:      getEnv("INTERNAL_SECRET", "insecure-secret-for-dev"),
		WebURL:             getEnv("WEB_URL", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	log.Printf("Using default value for %s: %s", key, fallback)
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		var i int
		_, err := fmt.Sscanf(value, "%d", &i)
		if err == nil {
			return i
		}
	}
	log.Printf("Using default value for %s: %d", key, fallback)
	return fallback
}
