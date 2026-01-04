package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                 string
	JWTSecret            string
	AuthServiceURL       string
	AuthServiceGRPCURL   string
	InstructorServiceURL string
	StudentServiceURL    string
	SystemServiceURL     string
}

func LoadConfig() *Config {
	godotenv.Load() // Ignore error if file not found (e.g. in Docker)

	return &Config{
		Port:                 getEnv("PORT", "8080"),
		JWTSecret:            getEnv("JWT_SECRET", "supersecretkey"),
		AuthServiceURL:       getEnv("AUTH_SERVICE_URL", "http://auth-service:5000"),
		AuthServiceGRPCURL:   getEnv("AUTH_SERVICE_GRPC_URL", "auth-service:50051"),
		InstructorServiceURL: getEnv("INSTRUCTOR_SERVICE_URL", "http://instructor-service:8081"),
		StudentServiceURL:    getEnv("STUDENT_SERVICE_URL", "http://student-service:8084"),
		SystemServiceURL:     getEnv("SYSTEM_SERVICE_URL", "http://system-service:8081"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
