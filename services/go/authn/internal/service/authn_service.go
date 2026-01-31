package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/4yrg/gradeloop-core/services/go/authn/internal/config"
	"github.com/redis/go-redis/v9"
	"golang.org/x/net/context"
)

type AuthNService struct {
	cfg   *config.Config
	redis *redis.Client
	token *TokenService
}

func NewAuthNService(cfg *config.Config) *AuthNService {
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	return &AuthNService{
		cfg:   cfg,
		redis: rdb,
		token: NewTokenService(),
	}
}

// Data models for external services
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegistrationRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Login Orchestration
func (s *AuthNService) Login(ctx context.Context, email, password string) (*TokenResponse, error) {
	// 1. Validate Credentials via Identity Service
	// TODO: Call Identity Service CheckCreds

	// 2. Create Session via Session Service
	// TODO: Call Session Service Create

	// 3. Get Permissions via AuthZ Service
	// TODO: Call AuthZ Service for roles/perms

	// 4. Generate Tokens
	// Mock roles for now
	accessToken, err := s.token.GenerateAccessToken("user_id_placeholder", "student", []string{"read:courses"})
	if err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: "mock_refresh_token_" + email,
	}, nil
}

func (s *AuthNService) ValidateToken(ctx context.Context, tokenString string) (*UserClaims, error) {
	return s.token.ValidateToken(tokenString)
}

func (s *AuthNService) RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	// TODO: Validate refresh token via Session Service

	// Mock regeneration
	accessToken, err := s.token.GenerateAccessToken("user_id_placeholder", "student", []string{"read:courses"})
	if err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken, // Rotate if needed
	}, nil
}

func (s *AuthNService) Logout(ctx context.Context, token string) error {
	// TODO: Blacklist access token or revoke session
	return nil
}

// Register Orchestration
func (s *AuthNService) Register(ctx context.Context, req RegistrationRequest) error {
	// 1. Create User in Identity Service
	userPayload, _ := json.Marshal(req)
	resp, err := http.Post(s.cfg.IdentityServiceURL+"/internal/users", "application/json", bytes.NewBuffer(userPayload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return errors.New("failed to create user in identity service")
	}

	// 2. Send Welcome Email via Email Service
	emailPayload := map[string]string{
		"to":      req.Email,
		"subject": "Welcome to GradeLoop",
		"body":    "Welcome " + req.FirstName + "!", // Simple text for now
	}
	emailBody, _ := json.Marshal(emailPayload)
	_, _ = http.Post(s.cfg.EmailServiceURL+"/internal/email/send", "application/json", bytes.NewBuffer(emailBody))
	// Ignore email error for now, non-blocking

	return nil
}

// Helper for generic HTTP post
func (s *AuthNService) postJson(url string, data interface{}) (*http.Response, error) {
	payload, _ := json.Marshal(data)
	return http.Post(url, "application/json", bytes.NewBuffer(payload))
}
