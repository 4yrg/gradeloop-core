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

	"context"

	"github.com/4yrg/gradeloop-core/services/go/authn/internal/config"
	"github.com/redis/go-redis/v9"
)

type AuthNService struct {
	cfg   *config.Config
	redis *redis.Client
	token *TokenService
}

func NewAuthNService(cfg *config.Config) *AuthNService {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Username: cfg.RedisUsername,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	return &AuthNService{
		cfg:   cfg,
		redis: rdb,
		token: NewTokenService(),
	}
}

// Data models for external services
type LoginRequest struct {
	Email string `json:"email"`
}

type RegistrationRequest struct {
	Email    string `json:"email"`
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
	// ForceReset removed
}

// Internal Service Response Models
type IdentityVerifyResponse struct {
	Valid    bool   `json:"valid"` // Still used? Maybe check user existence
	UserID   string `json:"id"`
	Role     string `json:"user_type"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Status   string `json:"status"` // pending, active
}

type SessionCreateResponse struct {
	SessionID    string `json:"session_id"`
	RefreshToken string `json:"refresh_token"`
}

type AuthZresolveResponse struct {
	Permissions []string `json:"permissions"`
}

// Login Orchestration - Magic Link Flow

// RequestMagicLink initiates the login flow
func (s *AuthNService) RequestMagicLink(ctx context.Context, email string) error {
	// 1. Lookup User via Identity Service
	lookupPayload := map[string]string{
		"email": email,
	}
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/users/lookup", lookupPayload)
	if err != nil {
		fmt.Printf("[AuthN] User lookup error for %s: %v\n", email, err)
		return nil // Return success to avoid email enumeration
	}
	defer resp.Body.Close()

	var user IdentityVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil
	}

	if user.Status == "disabled" {
		return nil
	}

	// 2. Generate Magic Link Token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return err
	}
	token := hex.EncodeToString(tokenBytes)

	// 3. Store in Redis (15 min expiry)
	redisKey := "magic_link:" + token
	// Store UserID as value. Could store JSON if need more context.
	err = s.redis.Set(ctx, redisKey, user.UserID, 15*time.Minute).Err()
	if err != nil {
		return err
	}

	// 4. Send Email
	authUrl := s.cfg.WebURL
	if authUrl == "" {
		authUrl = "http://localhost:3000"
	}
	// Frontend generic verifier page
	magicLink := fmt.Sprintf("%s/verify?token=%s&type=login", authUrl, token)
	fmt.Printf("[AuthN-DEV] Magic Link for %s: %s\n", email, magicLink)

	emailPayload := map[string]string{
		"to":      email,
		"subject": "Log in to GradeLoop",
		"body":    fmt.Sprintf("Click here to log in:\n%s\n\nThis link expires in 15 minutes.", magicLink),
		// "template": "magic_login", // If using templates
		// "link": magicLink,
	}

	resp, err = s.postJson(s.cfg.EmailServiceURL+"/internal/email/send", emailPayload)
	if err != nil {
		fmt.Printf("[AuthN] Failed to send magic link email to %s: %v\n", email, err)
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("[AuthN] Email service returned status %d for %s\n", resp.StatusCode, email)
		return fmt.Errorf("email service error: status %d", resp.StatusCode)
	}

	fmt.Printf("[AuthN] Successfully initiated magic link email for %s\n", email)
	return nil
}

// ConsumeMagicLink validates the token and logs the user in
func (s *AuthNService) ConsumeMagicLink(ctx context.Context, token string) (*TokenResponse, error) {
	// 1. Validate Token from Redis
	redisKey := "magic_link:" + token
	userID, err := s.redis.Get(ctx, redisKey).Result()
	if err != nil {
		return nil, errors.New("invalid or expired magic link")
	}

	// Delete token immediately (single use)
	s.redis.Del(ctx, redisKey)

	// 2. Get User Details from Identity Service
	resp, err := s.Get(s.cfg.IdentityServiceURL + "/internal/identity/users/" + userID)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var user IdentityVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	// 3. Create Session via Session Service
	sessionPayload := map[string]string{
		"user_id":   user.UserID,
		"user_role": user.Role,
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

	// 4. Get Permissions via AuthZ Service
	authzPayload := map[string]string{
		"user_id": user.UserID,
		"role":    user.Role,
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

	// 5. Generate Tokens
	accessToken, err := s.token.GenerateAccessToken(user.UserID, sessionResp.SessionID, user.Role, authzResp.Permissions)
	if err != nil {
		return nil, err
	}

	combinedToken := sessionResp.SessionID + ":" + sessionResp.RefreshToken
	encodedRefreshToken := base64.StdEncoding.EncodeToString([]byte(combinedToken))

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: encodedRefreshToken,
		Role:         user.Role,
		Email:        user.Email,
		UserID:       user.UserID,
		FullName:     user.FullName,
	}, nil
}

// RequestEmailConfirmation initiates registration flow
func (s *AuthNService) RequestEmailConfirmation(ctx context.Context, req RegistrationRequest) error {
	// 1. Create User in Identity Service (Status=pending)
	// RegistrationRequest matches CreateUserRequest mostly
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/users", req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return errors.New("failed to create user in identity service")
	}

	// Parse response to get ID
	var user struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return err
	}

	// 2. Generate Confirmation Token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return err
	}
	token := hex.EncodeToString(tokenBytes)

	// 3. Store in Redis
	redisKey := "confirm_email:" + token
	err = s.redis.Set(ctx, redisKey, user.ID, 24*time.Hour).Err()
	if err != nil {
		return err
	}

	// 4. Send Confirmation Email via Email Service
	authUrl := s.cfg.WebURL
	if authUrl == "" {
		authUrl = "http://localhost:3000"
	}
	confirmLink := fmt.Sprintf("%s/verify?token=%s&type=confirm", authUrl, token)
	fmt.Printf("[AuthN-DEV] Confirmation Link for %s: %s\n", req.Email, confirmLink)

	emailPayload := map[string]string{
		"to":      req.Email,
		"subject": "Welcome to GradeLoop - Confirm your email",
		"body":    fmt.Sprintf("Welcome " + req.FullName + "!\n\nPlease confirm your email by clicking here:\n" + confirmLink),
	}
	_, _ = s.postJson(s.cfg.EmailServiceURL+"/internal/email/send", emailPayload)

	return nil
}

// ConsumeConfirmationToken confirms email
func (s *AuthNService) ConsumeConfirmationToken(ctx context.Context, token string) (*TokenResponse, error) {
	// 1. Validate Token
	redisKey := "confirm_email:" + token
	userID, err := s.redis.Get(ctx, redisKey).Result()
	if err != nil {
		return nil, errors.New("invalid or expired confirmation link")
	}
	s.redis.Del(ctx, redisKey) // Single use

	// 2. Call Identity Service to Update Status
	resp, err := s.postJson(s.cfg.IdentityServiceURL+"/internal/identity/users/"+userID+"/confirm-email", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to confirm user email in identity service")
	}

	// 3. Proceed to Login (Generate tokens)
	// We can reuse ConsumeMagicLink logic by storing a magic token or refactoring.
	// Or just generate tokens here.

	// Retrieve user details
	resp, err = s.Get(s.cfg.IdentityServiceURL + "/internal/identity/users/" + userID)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var user IdentityVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	// Create Session
	sessionPayload := map[string]string{
		"user_id":   user.UserID,
		"user_role": user.Role,
	}
	resp, err = s.postJson(s.cfg.SessionServiceURL+"/internal/sessions", sessionPayload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var sessionResp SessionCreateResponse
	if err := json.NewDecoder(resp.Body).Decode(&sessionResp); err != nil {
		return nil, err
	}

	// Get Permissions
	authzPayload := map[string]string{
		"user_id": user.UserID,
		"role":    user.Role,
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

	accessToken, err := s.token.GenerateAccessToken(user.UserID, sessionResp.SessionID, user.Role, authzResp.Permissions)
	if err != nil {
		return nil, err
	}

	combinedToken := sessionResp.SessionID + ":" + sessionResp.RefreshToken
	encodedRefreshToken := base64.StdEncoding.EncodeToString([]byte(combinedToken))

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: encodedRefreshToken,
		Role:         user.Role,
		Email:        user.Email,
		UserID:       user.UserID,
		FullName:     user.FullName,
	}, nil
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
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("[AuthN] HTTP POST error to %s: %v\n", url, err)
	}
	return resp, err
}

// RefreshToken refreshes the access token using a refresh token
func (s *AuthNService) RefreshToken(ctx context.Context, refreshToken string) (*TokenResponse, error) {
	// 1. Decode refresh token to get SessionID
	// The refresh token is base64 encoded "sessionID:refreshToken"
	decodedBytes, err := base64.StdEncoding.DecodeString(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token format")
	}
	parts := strings.Split(string(decodedBytes), ":")
	if len(parts) != 2 {
		return nil, errors.New("invalid refresh token format")
	}
	sessionID := parts[0]
	actualRefreshToken := parts[1]

	// 2. Validate with Session Service
	payload := map[string]string{
		"refresh_token": actualRefreshToken,
	}
	resp, err := s.postJson(s.cfg.SessionServiceURL+"/internal/sessions/"+sessionID+"/refresh", payload)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid or expired refresh token")
	}

	var sessionResp SessionCreateResponse
	if err := json.NewDecoder(resp.Body).Decode(&sessionResp); err != nil {
		return nil, err
	}

	// 3. Get User Details (to regenerate claims)
	// We need to look up the session to get the user ID, or generic refresh might return it.
	// Assuming Session Service refresh returns the new tokens but we need to sign the JWT.
	// Wait, the session service manages the refresh token rotation, but WE manage the JWT (Access Token).
	// We need the UserID and Role to generate a new Access Token.
	// Let's assume the Session Service returns the UserID in the refresh response or we need to fetch it.
	// For now let's query the session details or trust the session service to have validated it.
	// IF the session service doesn't return user details, we might need to store them in the session or fetch them.

	// Let's fetch the Session details first to get UserID if needed.
	// Actually, let's check what SessionCreateResponse contains. It has SessionID and RefreshToken.
	// We might need to ask Session Service for the user_id associated with this session.

	// Let's try to get session details.
	sessResp, err := s.Get(s.cfg.SessionServiceURL + "/internal/sessions/" + sessionID)
	if err != nil {
		return nil, errors.New("failed to retrieve session details")
	}
	defer sessResp.Body.Close()

	if sessResp.StatusCode != http.StatusOK {
		return nil, errors.New("session not found")
	}

	var session struct {
		UserID   string `json:"user_id"`
		UserRole string `json:"user_role"`
		// ...
	}
	if err := json.NewDecoder(sessResp.Body).Decode(&session); err != nil {
		return nil, err
	}

	// 4. Get latest permissions
	authzPayload := map[string]string{
		"user_id": session.UserID,
		"role":    session.UserRole,
	}
	azResp, err := s.postJson(s.cfg.AuthZServiceURL+"/internal/authz/resolve", authzPayload)
	if err != nil {
		return nil, err
	}
	defer azResp.Body.Close()

	var authzResp AuthZresolveResponse
	if azResp.StatusCode == http.StatusOK {
		_ = json.NewDecoder(azResp.Body).Decode(&authzResp)
	}

	// 5. Generate New Access Token
	accessToken, err := s.token.GenerateAccessToken(session.UserID, sessionResp.SessionID, session.UserRole, authzResp.Permissions)
	if err != nil {
		return nil, err
	}

	// Encode new refresh token
	combinedToken := sessionResp.SessionID + ":" + sessionResp.RefreshToken
	encodedRefreshToken := base64.StdEncoding.EncodeToString([]byte(combinedToken))

	// We need User details for the response
	userResp, err := s.Get(s.cfg.IdentityServiceURL + "/internal/identity/users/" + session.UserID)
	var user IdentityVerifyResponse
	if err == nil && userResp.StatusCode == http.StatusOK {
		_ = json.NewDecoder(userResp.Body).Decode(&user)
		userResp.Body.Close()
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: encodedRefreshToken,
		Role:         session.UserRole,
		Email:        user.Email,
		UserID:       session.UserID,
		FullName:     user.FullName,
	}, nil
}

func (s *AuthNService) Logout(ctx context.Context, tokenString string) error {
	// 1. Validate token to get session ID
	claims, err := s.token.ValidateToken(tokenString)
	if err != nil {
		return nil // Already invalid
	}

	// 2. Revoke session in Session Service
	if claims.SessionID != "" {
		_, err := s.postJson(s.cfg.SessionServiceURL+"/internal/sessions/"+claims.SessionID+"/revoke", nil)
		if err != nil {
			fmt.Printf("[AuthN] Failed to revoke session %s: %v\n", claims.SessionID, err)
			return err
		}
	}
	return nil
}

func (s *AuthNService) LogoutAll(ctx context.Context, userID string) error {
	// 1. Call Session Service to revoke all sessions for user
	_, err := s.postJson(s.cfg.SessionServiceURL+"/internal/sessions/user/"+userID+"/revoke-all", nil)
	if err != nil {
		return err
	}
	return nil
}

func (s *AuthNService) ValidateToken(ctx context.Context, tokenString string) (*UserClaims, error) {
	return s.token.ValidateToken(tokenString)
}

func (s *AuthNService) PingRedis() error {
	return s.redis.Ping(context.Background()).Err()
}

func (s *AuthNService) Get(url string) (*http.Response, error) {

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Internal-Token", s.cfg.InternalToken)

	client := &http.Client{}
	return client.Do(req)
}
