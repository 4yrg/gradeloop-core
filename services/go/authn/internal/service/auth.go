package service

import (
	"context"
	"fmt"

	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/authn/internal/config"
	"github.com/4yrg/gradeloop-core/libs/proto/email"
	"github.com/4yrg/gradeloop-core/libs/proto/session"
	"github.com/4yrg/gradeloop-core/libs/proto/user"
	"github.com/golang-jwt/jwt/v5"
)

type AuthResponse struct {
	Session     *session.Session
	AccessToken string
}

type AuthService struct {
	cfg            *config.Config
	identityClient user.UserServiceClient
	sessionClient  session.SessionServiceClient
	emailClient    email.EmailServiceClient
}

func NewAuthService(cfg *config.Config, ic user.UserServiceClient, sc session.SessionServiceClient, ec email.EmailServiceClient) *AuthService {
	return &AuthService{
		cfg:            cfg,
		identityClient: ic,
		sessionClient:  sc,
		emailClient:    ec,
	}
}

func (s *AuthService) Login(ctx context.Context, email, password, userAgent, clientIP string) (*AuthResponse, error) {
	// 1. Validate Credentials via Identity Service
	valResp, err := s.identityClient.ValidateCredentials(ctx, &user.ValidateCredentialsRequest{
		Email:    email,
		Password: password,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to call identity service: %w", err)
	}
	if !valResp.Valid {
		return nil, fmt.Errorf("invalid credentials")
	}

	// 2. Create Session via Session Service
	// Need to check UserRole? ValidateCredentials response has UserResponse which might have Info?
	// Identify Service ValidateCredentials returns UserResponse { UserId, Email }. Role is missing in UserResponse in proto?
	// Let's check user.proto UserResponse.
	// message UserResponse { user_id, email, temp_password }. Role is NOT there.
	// Gap: I need User Role to Create Session (session requires role).
	// Identity Service gRPC ValidateCredentials logic maps models.User -> UserResponse.
	// I should update user.proto `UserResponse` to include `role`.
	// Or call `GetProfile` using `UserId`?
	// `GetProfile(UserId)` returns `UserProfile` which has `role`.

	// Option A: Update user.proto and Identity Server (fastest if I can edit).
	// Option B: Call GetProfile.
	// I will Call GetProfile for now to avoid re-editing protos/servers loop if possible (though I did just edit them).
	// Actually, modifying proto is cleaner but requires re-gen and re-implement.
	// I'll use GetProfile.

	profile, err := s.identityClient.GetProfile(ctx, &user.GetProfileRequest{UserId: valResp.User.UserId})
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	sessResp, err := s.sessionClient.CreateSession(ctx, &session.CreateSessionRequest{
		UserId:    valResp.User.UserId,
		UserRole:  profile.Role,
		UserAgent: userAgent,
		ClientIp:  clientIP,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// 3. Generate JWT Access Token
	accessToken, err := s.GenerateAccessToken(valResp.User.UserId, profile.Email, profile.Role, sessResp.Id)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	return &AuthResponse{
		Session:     sessResp,
		AccessToken: accessToken,
	}, nil
}

func (s *AuthService) GenerateAccessToken(userID, email, role, sessionID string) (string, error) {
	claims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"role":  role,
		"sid":   sessionID,
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(15 * time.Minute).Unix(), // 15m expiry for access token
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWT.Secret))
}
