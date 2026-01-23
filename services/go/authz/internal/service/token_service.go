package service

import (
	"errors"
	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/config"
	"github.com/4yrg/gradeloop-core/libs/security"
)

type TokenService struct {
	signer         *security.TokenSigner
	serviceSecrets map[string]string
}

func NewTokenService(signer *security.TokenSigner, cfg *config.Config) *TokenService {
	return &TokenService{
		signer:         signer,
		serviceSecrets: cfg.Auth.ServiceSecrets,
	}
}

func (s *TokenService) IssueServiceToken(serviceID, secret string) (string, error) {
	// 1. Verify Service Credentials
	expectedSecret, ok := s.serviceSecrets[serviceID]
	if !ok {
		return "", errors.New("service not found")
	}
	if secret != expectedSecret {
		return "", errors.New("invalid service secret")
	}

	// 2. Define Roles/Scopes (Hardcoded for Day 1 Simplified)
	// In a real system, we'd lookup a Service Registry or DB
	role := "service"
	var scopes []string
	if serviceID == "identity-service" {
		scopes = []string{"authz.read", "user.write"}
	} else {
		scopes = []string{"read"}
	}

	// 3. Sign Token
	// 1 hour expiration for service tokens
	return s.signer.SignServiceToken(serviceID, role, scopes, 1*time.Hour)
}
