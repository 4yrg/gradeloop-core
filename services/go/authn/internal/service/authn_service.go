package service

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

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
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
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
	Role         string `json:"role"`
	Email        string `json:"email"`
	UserID       string `json:"user_id"`
	FullName     string `json:"full_name"`
	ForceReset   bool   `json:"forceReset"` // Matches user.forceReset in frontend
}

// Internal Service Response Models
type IdentityVerifyResponse struct {
	Valid      bool   `json:"valid"`
	UserID     string `json:"user_id"`
	Role       string `json:"role"`
	Email      string `json:"email"`
	FullName   string `json:"full_name"`
	ForceReset bool   `json:"force_reset"`
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
	accessToken, err := s.token.GenerateAccessToken(identityResp.UserID, sessionResp.SessionID, identityResp.Role, authzResp.Permissions)
	if err != nil {
		return nil, err
	}

	// Combine Session ID and Refresh Token for client
	combinedToken := sessionResp.SessionID + ":" + sessionResp.RefreshToken
	encodedRefreshToken := base64.StdEncoding.EncodeToString([]byte(combinedToken))

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: encodedRefreshToken,
		Role:         identityResp.Role,
		Email:        identityResp.Email,
		UserID:       identityResp.UserID,
		FullName:     identityResp.FullName,
		ForceReset:   identityResp.ForceReset,
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
	accessToken, err := s.token.GenerateAccessToken(sessionResp.UserID, sessionResp.SessionID, sessionResp.UserRole, authzResp.Permissions)
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
	// Extract session ID from access token
	claims, err := s.token.ValidateToken(token)
	if err != nil {
		return errors.New("invalid token")
	}

	// Revoke the session via Session Service
	url := s.cfg.SessionServiceURL + "/internal/sessions/" + claims.SessionID + "/revoke"
	resp, err := s.postJson(url, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("failed to revoke session")
	}

	return nil
}

func (s *AuthNService) Register(ctx context.Context, req RegistrationRequest) error {
	// 1. Create User in Identity Service
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/users", req)
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
	_, _ = s.postJson(s.cfg.EmailServiceURL+"/internal/email/send", emailPayload)

	return nil
}

func (s *AuthNService) LogoutAll(ctx context.Context, userID string) error {
	url := s.cfg.SessionServiceURL + "/internal/users/" + userID + "/sessions/revoke"
	resp, err := s.postJson(url, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func (s *AuthNService) ForgotPassword(ctx context.Context, email string) error {
	// 1. Lookup UserID by Email from Identity Service
	lookupPayload := map[string]string{
		"email": email,
	}
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/users/lookup", lookupPayload)
	if err != nil {
		// Log error but do not return it to prevent email enumeration
		// In a real logger, log at error level
		fmt.Println("Error looking up user for forgot password:", err)
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// User not found or error. Return nil to mimic success for security.
		return nil
	}

	var user struct {
		ID       string `json:"id"`
		Email    string `json:"email"`
		FullName string `json:"full_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		fmt.Println("Error decoding user lookup response:", err)
		return nil
	}

	// 2. Generate cryptographically secure reset token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return fmt.Errorf("failed to generate reset token: %w", err)
	}
	resetToken := hex.EncodeToString(tokenBytes)

	// 3. Store valid token in Redis with UserID
	redisKey := "reset:" + resetToken
	err = s.redis.Set(ctx, redisKey, user.ID, 15*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("failed to store reset token: %w", err)
	}

	// 4. Build reset link
	authUrl := s.cfg.WebURL // Should be configured, defaulting to localhost for now if not in cfg
	if authUrl == "" {
		authUrl = "http://localhost:3000"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", authUrl, resetToken)

	// 5. Send email
	emailPayload := map[string]string{
		"to":      user.Email,
		"subject": "Password Reset Request",
		"body":    fmt.Sprintf("Hello %s,\n\nClick here to reset your password: %s\n\nThis link expires in 15 minutes.", user.FullName, resetLink),
	}
	// Fire-and-forget
	_, _ = s.postJson(s.cfg.EmailServiceURL+"/internal/email/send", emailPayload)

	return nil
}

func (s *AuthNService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// Validate token exists in Redis
	redisKey := "reset:" + token
	userID, err := s.redis.Get(ctx, redisKey).Result()
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Delete token immediately
	s.redis.Del(ctx, redisKey)

	// Call Identity Service to update password using UserID
	updatePayload := map[string]string{
		"user_id":      userID,
		"new_password": newPassword,
	}
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/credentials/update", updatePayload)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("failed to update password in identity service")
	}

	return nil
}

func (s *AuthNService) IssueToken(ctx context.Context, userID, role string, permissions []string) (*TokenResponse, error) {
	// For delegated token issuance, we don't have a session, so use empty string
	accessToken, err := s.token.GenerateAccessToken(userID, "", role, permissions)
	if err != nil {
		return nil, err
	}
	// No refresh token for delegated issuance usually, or maybe yes?
	// Spec says "Used only if other services need delegated token issuance."
	return &TokenResponse{
		AccessToken: accessToken,
	}, nil
}

// Helper for generic HTTP post with internal token
func (s *AuthNService) postJson(url string, data interface{}) (*http.Response, error) {
	payload, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Token", s.cfg.InternalToken)

	client := &http.Client{}
	return client.Do(req)
}
