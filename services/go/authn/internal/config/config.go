package config

import (
	"log"
	"os"
)

type Config struct {
	Port               string
	RedisAddr          string
	RedisPassword      string
	IdentityServiceURL string
	SessionServiceURL  string
	EmailServiceURL    string
	AuthZServiceURL    string
	InternalToken      string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8003"),
		RedisAddr:          getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:      getEnv("REDIS_PASSWORD", ""),
		IdentityServiceURL: getEnv("IDENTITY_SERVICE_URL", "http://localhost:8001"),
		SessionServiceURL:  getEnv("SESSION_SERVICE_URL", "http://localhost:8002"),
		EmailServiceURL:    getEnv("EMAIL_SERVICE_URL", "http://localhost:5005"),
		AuthZServiceURL:    getEnv("AUTHZ_SERVICE_URL", "http://localhost:8004"),
		InternalToken:      getEnv("INTERNAL_SECRET", "insecure-secret-for-dev"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	log.Printf("Using default value for %s: %s", key, fallback)
	return fallback
}
