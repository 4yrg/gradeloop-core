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
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	UserType string `json:"user_type"`
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
	// userPayload, _ := json.Marshal(req) // Pass through directly as it now matches Identity schema more closely
	// Actually Identity expects: email, password, full_name, user_type.
	// Our req has these now (except json tags match).

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
		"body":    "Welcome " + req.FullName + "!", // Simple text for now
	}
	emailBody, _ := json.Marshal(emailPayload)
	_, _ = http.Post(s.cfg.EmailServiceURL+"/internal/email/send", "application/json", bytes.NewBuffer(emailBody))
	// Ignore email error for now, non-blocking

	// Ignore email error for now, non-blocking
	return nil
}

func (s *AuthNService) LogoutAll(ctx context.Context, userID string) error {
	// Call Session Service to revoke all
	// url := s.cfg.SessionServiceURL + "/internal/users/" + userID + "/sessions/revoke"
	// _, err := http.Post(url, "application/json", nil)
	// return err
	return nil
}

func (s *AuthNService) ForgotPassword(ctx context.Context, email string) error {
	// 1. Generate reset token (short lived JWT or random string)
	// 2. Send email via Email Service
	return nil
}

func (s *AuthNService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// 1. Validate token
	// 2. Update credential in Identity Service
	return nil
}

func (s *AuthNService) IssueToken(ctx context.Context, userID, role string, permissions []string) (*TokenResponse, error) {
	accessToken, err := s.token.GenerateAccessToken(userID, role, permissions)
	if err != nil {
		return nil, err
	}
	// No refresh token for delegated issuance usually, or maybe yes?
	// Spec says "Used only if other services need delegated token issuance."
	return &TokenResponse{
		AccessToken: accessToken,
	}, nil
}

// Helper for generic HTTP post
func (s *AuthNService) postJson(url string, data interface{}) (*http.Response, error) {
	payload, _ := json.Marshal(data)
	return http.Post(url, "application/json", bytes.NewBuffer(payload))
}
