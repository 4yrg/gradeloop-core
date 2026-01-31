package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/session/internal/core"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrSessionNotFound = errors.New("session not found")
	ErrSessionExpired  = errors.New("session expired")
	ErrSessionRevoked  = errors.New("session revoked")
	ErrInvalidToken    = errors.New("invalid refresh token")
)

type SessionService struct {
	repo            core.SessionRepository
	cache           core.SessionCache
	sessionTTL      time.Duration
	refreshTokenTTL time.Duration
}

func NewSessionService(repo core.SessionRepository, cache core.SessionCache, sessionTTL, refreshTokenTTL time.Duration) *SessionService {
	return &SessionService{
		repo:            repo,
		cache:           cache,
		sessionTTL:      sessionTTL,
		refreshTokenTTL: refreshTokenTTL,
	}
}

func (s *SessionService) CreateSession(ctx context.Context, userID, role, ip, userAgent string) (*core.Session, string, error) {
	sessionID := uuid.New()
	rawToken, hash, err := s.generateRefreshToken()
	if err != nil {
		return nil, "", err
	}

	now := time.Now()
	session := &core.Session{
		ID:               sessionID,
		UserID:           userID,
		UserRole:         role,
		RefreshTokenHash: hash,
		UserAgent:        userAgent,
		ClientIP:         ip,
		RotationCounter:  1,
		CreatedAt:        now,
		ExpiresAt:        now.Add(s.refreshTokenTTL),
	}

	// Persist to DB
	if err := s.repo.Create(ctx, session); err != nil {
		return nil, "", err
	}

	// Cache (use sessionTTL or refreshTokenTTL, usually session validity is shorter if using JWTs,
	// but here the session IS the refresh token validity essentially.
	// Let's use refreshTokenTTL for the session object in cache for now)
	if err := s.cache.Set(ctx, session); err != nil {
		// Log error but don't fail, cache is optional
	}

	return session, rawToken, nil
}

func (s *SessionService) ValidateSession(ctx context.Context, sessionID uuid.UUID) (*core.Session, error) {
	// Try cache first
	session, err := s.cache.Get(ctx, sessionID)
	if err == nil && session != nil {
		return session, nil
	}

	// Fallback to DB
	session, err = s.repo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err // Could be not found
	}

	if session.IsRevoked() {
		return nil, ErrSessionRevoked
	}
	if session.IsExpired() {
		return nil, ErrSessionExpired
	}

	// Re-populate cache
	_ = s.cache.Set(ctx, session)

	return session, nil
}

func (s *SessionService) RefreshSession(ctx context.Context, sessionID uuid.UUID, refreshToken string) (*core.Session, string, error) {
	// Get session
	session, err := s.ValidateSession(ctx, sessionID)
	if err != nil {
		return nil, "", err
	}

	// Validate Token
	if err := bcrypt.CompareHashAndPassword([]byte(session.RefreshTokenHash), []byte(refreshToken)); err != nil {
		// Possible token theft / replay!
		// Revoke session immediately
		_ = s.RevokeSession(ctx, sessionID)
		return nil, "", ErrInvalidToken
	}

	// Rotate Token
	rawToken, hash, err := s.generateRefreshToken()
	if err != nil {
		return nil, "", err
	}

	session.RefreshTokenHash = hash
	session.RotationCounter++
	session.ExpiresAt = time.Now().Add(s.refreshTokenTTL) // Extension? Or keeping absolute expiry? Requirements say "Refresh Token Rotation", usually extends life.

	// Update DB
	if err := s.repo.Update(ctx, session); err != nil {
		return nil, "", err
	}

	// Update Cache
	_ = s.cache.Set(ctx, session)

	return session, rawToken, nil
}

func (s *SessionService) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	// Update DB
	if err := s.repo.Revoke(ctx, sessionID); err != nil {
		return err
	}

	// Invalidate Cache
	return s.cache.Delete(ctx, sessionID)
}

func (s *SessionService) RevokeAllUserSessions(ctx context.Context, userID string) error {
	// Update DB
	if err := s.repo.RevokeAllForUser(ctx, userID); err != nil {
		return err
	}

	// Invalidate Cache
	return s.cache.DeleteAllForUser(ctx, userID)
}

func (s *SessionService) generateRefreshToken() (string, string, error) {
	// Generate random 32 bytes
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	rawToken := base64.URLEncoding.EncodeToString(b)

	// Hash it
	hash, err := bcrypt.GenerateFromPassword([]byte(rawToken), bcrypt.DefaultCost)
	if err != nil {
		return "", "", err
	}

	return rawToken, string(hash), nil
}
