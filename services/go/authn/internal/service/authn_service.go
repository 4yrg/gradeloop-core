package service

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

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

// Internal Service Response Models
type IdentityVerifyResponse struct {
	Valid  bool   `json:"valid"`
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

type SessionCreateResponse struct {
	SessionID    string `json:"session_id"`
	RefreshToken string `json:"refresh_token"`
}

type AuthZresolveResponse struct {
	Permissions []string `json:"permissions"`
}

// Login Orchestration
func (s *AuthNService) Login(ctx context.Context, email, password string) (*TokenResponse, error) {
	// 1. Validate Credentials via Identity Service
	credPayload := map[string]string{
		"email":    email,
		"password": password,
	}
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/credentials/verify", credPayload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("authentication failed")
	}

	var identityResp IdentityVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&identityResp); err != nil {
		return nil, err
	}

	if !identityResp.Valid {
		return nil, errors.New("invalid credentials")
	}

	// 2. Create Session via Session Service
	// TODO: Get Client IP and User Agent from context if possible, or pass them in
	sessionPayload := map[string]string{
		"user_id":   identityResp.UserID,
		"user_role": identityResp.Role,
	}
	resp, err = s.postJson(s.cfg.SessionServiceURL+"/internal/sessions", sessionPayload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return nil, errors.New("failed to create session")
	}

	var sessionResp SessionCreateResponse
	if err := json.NewDecoder(resp.Body).Decode(&sessionResp); err != nil {
		return nil, err
	}

	// 3. Get Permissions via AuthZ Service
	authzPayload := map[string]string{
		"user_id": identityResp.UserID,
		"role":    identityResp.Role,
	}
	resp, err = s.postJson(s.cfg.AuthZServiceURL+"/internal/authz/resolve", authzPayload)
	if err != nil {
		// Fallback to empty permissions or fail? Failing is safer.
		return nil, err
	}
	defer resp.Body.Close()

	var authzResp AuthZresolveResponse
	if resp.StatusCode == http.StatusOK {
		_ = json.NewDecoder(resp.Body).Decode(&authzResp)
	}

	// 4. Generate Tokens
	accessToken, err := s.token.GenerateAccessToken(identityResp.UserID, identityResp.Role, authzResp.Permissions)
	if err != nil {
		return nil, err
	}

	// Combine Session ID and Refresh Token for client
	combinedToken := sessionResp.SessionID + ":" + sessionResp.RefreshToken
	encodedRefreshToken := base64.StdEncoding.EncodeToString([]byte(combinedToken))

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: encodedRefreshToken,
	}, nil
}

func (s *AuthNService) ValidateToken(ctx context.Context, tokenString string) (*UserClaims, error) {
	return s.token.ValidateToken(tokenString)
}

type SessionRefreshResponse struct {
	SessionID       string `json:"session_id"`
	NewRefreshToken string `json:"new_refresh_token"`
	UserID          string `json:"user_id"`
	UserRole        string `json:"user_role"`
}

func (s *AuthNService) RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	// Decode refresh token to get session_id and actual token
	decodedBytes, err := base64.StdEncoding.DecodeString(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token format")
	}
	decodedString := string(decodedBytes)
	parts := strings.Split(decodedString, ":")
	if len(parts) != 2 {
		return nil, errors.New("invalid refresh token format")
	}
	sessionID := parts[0]
	actualRefreshToken := parts[1]

	// 1. Refresh via Session Service
	refreshPayload := map[string]string{
		"session_id":    sessionID,
		"refresh_token": actualRefreshToken,
	}
	resp, err := s.postJson(s.cfg.SessionServiceURL+"/internal/sessions/refresh", refreshPayload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid refresh token")
	}

	var sessionResp SessionRefreshResponse
	if err := json.NewDecoder(resp.Body).Decode(&sessionResp); err != nil {
		return nil, err
	}

	// 2. Get Permissions via AuthZ Service (using cached role from session)
	authzPayload := map[string]string{
		"user_id": sessionResp.UserID,
		"role":    sessionResp.UserRole,
	}
	resp, err = s.postJson(s.cfg.AuthZServiceURL+"/internal/authz/resolve", authzPayload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var authzResp AuthZresolveResponse
	if resp.StatusCode == http.StatusOK {
		_ = json.NewDecoder(resp.Body).Decode(&authzResp)
	}

	// 3. Generate New Access Token
	accessToken, err := s.token.GenerateAccessToken(sessionResp.UserID, sessionResp.UserRole, authzResp.Permissions)
	if err != nil {
		return nil, err
	}

	// 4. Return new tokens (Session service rotates refresh token)
	combinedToken := sessionResp.SessionID + ":" + sessionResp.NewRefreshToken
	newEncodedRefreshToken := base64.StdEncoding.EncodeToString([]byte(combinedToken))

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newEncodedRefreshToken,
	}, nil
}

func (s *AuthNService) Logout(ctx context.Context, token string) error {
	// Extract session ID if possible? Access Token might not have it unless we put it claims.
	// OR use Refresh Token to logout?
	// Usually Logout requires Access Token.
	// We'll require Access Token but we can't revoke session easily without SessionID.
	// For now, no-op or we need to add SessionID to AccessToken.
	// Let's assume we can't fully revoke on backend without SessionID, so client must discard.
	// Alternatively, if token has user_id, we could revoke all? No, that's LogoutAll.
	return nil
}

func (s *AuthNService) Register(ctx context.Context, req RegistrationRequest) error {
	// 1. Create User in Identity Service
	userPayload, _ := json.Marshal(req)
	resp, err := http.Post(s.cfg.IdentityServiceURL+"/internal/identity/users", "application/json", bytes.NewBuffer(userPayload))
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
		"body":    "Welcome " + req.FullName + "!",
	}
	emailBody, _ := json.Marshal(emailPayload)
	_, _ = http.Post(s.cfg.EmailServiceURL+"/internal/email/send", "application/json", bytes.NewBuffer(emailBody))

	return nil
}

func (s *AuthNService) LogoutAll(ctx context.Context, userID string) error {
	url := s.cfg.SessionServiceURL + "/internal/users/" + userID + "/sessions/revoke"
	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func (s *AuthNService) ForgotPassword(ctx context.Context, email string) error {
	emailPayload := map[string]string{
		"to":      email,
		"subject": "Reset Password",
		"body":    "Click here to reset: http://localhost:3000/reset?token=dummy",
	}
	emailBody, _ := json.Marshal(emailPayload)
	_, _ = http.Post(s.cfg.EmailServiceURL+"/internal/email/send", "application/json", bytes.NewBuffer(emailBody))
	return nil
}

func (s *AuthNService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// Stub
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
