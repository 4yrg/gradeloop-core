package service

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ServiceTokenService struct {
	jwtSecret []byte
}

func NewServiceTokenService() *ServiceTokenService {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "insecure-jwt-secret-for-dev"
	}
	return &ServiceTokenService{
		jwtSecret: []byte(secret),
	}
}

// GenerateServiceToken creates a long-lived JWT for service-to-service authentication
func (s *ServiceTokenService) GenerateServiceToken(serviceName string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  serviceName,
		"type": "service",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(365 * 24 * time.Hour).Unix(), // 1 year expiration
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
