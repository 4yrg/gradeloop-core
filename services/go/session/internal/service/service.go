package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/gradeloop/session-service/internal/cache"
	"github.com/gradeloop/session-service/internal/models"
	"github.com/gradeloop/session-service/internal/store"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type SessionService struct {
	store *store.Store
	cache *cache.Cache
}

func New(s *store.Store, c *cache.Cache) *SessionService {
	return &SessionService{
		store: s,
		cache: c,
	}
}

// Session parameters
const (
	RefreshTokenLength = 32
	// Configurable durations? For now hardcoded or passed via config could be better
	AccessTokenTTL  = 15 * time.Minute
	RefreshTokenTTL = 7 * 24 * time.Hour
)

type CreateSessionInput struct {
	UserID    string
	UserRole  string
	UserAgent string
	ClientIP  string
}

type SessionTokens struct {
	SessionID    string    `json:"session_id"`
	RefreshToken string    `json:"refresh_token"` // Raw token
	ExpiresAt    time.Time `json:"expires_at"`
}

func (s *SessionService) CreateSession(ctx context.Context, input CreateSessionInput) (*SessionTokens, error) {
	// 1. Generate Session ID and Refresh Token
	sessionID := generateSecureToken(32) // Use a secure random string for ID too, or UUID
	if sessionID == "" {
		sessionID = uuid.New().String()
	}

	refreshTokenRaw := generateSecureToken(RefreshTokenLength)

	// 2. Hash refresh token
	hashedRefreshToken, err := hashToken(refreshTokenRaw)
	if err != nil {
		return nil, fmt.Errorf("failed to hash token: %w", err)
	}

	expiresAt := time.Now().Add(RefreshTokenTTL)

	// 3. Create Session Model
	session := &models.Session{
		ID:           sessionID,
		UserID:       input.UserID,
		UserRole:     input.UserRole,
		RefreshToken: hashedRefreshToken,
		UserAgent:    input.UserAgent,
		ClientIP:     input.ClientIP,
		ExpiresAt:    expiresAt,
		IsRevoked:    false,
	}

	// 4. Save to DB (Persistence)
	if err := s.store.CreateSession(session); err != nil {
		return nil, fmt.Errorf("failed to create session in db: %w", err)
	}

	// 5. Save to Redis (Cache) - TTL matches AccessTokenTTL usually, but we want session to be valid
	// The requirement says: "Session validation -> Redis first". "Expired sessions -> Redis TTL"
	// If Redis is for active sessions, maybe we cache it for RefreshTokenTTL?
	// Or usually we cache validation info for AccessTokenTTL, and hit DB for refresh?
	// Requirement: "Redis = source of truth for active sessions".
	// Let's cache for AccessTokenTTL (fast validation). If missing in Redis, check DB?
	// But later: "Validate sessions with low latency using Redis".
	// Re-reading requirements: "Expired sessions -> Redis TTL + background DB cleanup"
	// "Use TTL aligned with access token expiry" -> This implies Redis holds the "Access" session state.
	// If Access Token expires, client calls Refresh.
	// So Validate -> checks Redis.
	// Refresh -> rotates tokens, updates Redis + DB.

	if err := s.cache.SetSession(ctx, session, AccessTokenTTL); err != nil {
		// Log error but don't fail, DB is primary? Or fail?
		// "Redis = source of truth for active sessions" -> If failing to write to Redis, validation might fail or fallback to DB.
		// We'll return error to be safe.
		return nil, fmt.Errorf("failed to cache session: %w", err)
	}

	return &SessionTokens{
		SessionID:    sessionID,
		RefreshToken: refreshTokenRaw,
		ExpiresAt:    time.Now().Add(AccessTokenTTL),
	}, nil
}

func (s *SessionService) ValidateSession(ctx context.Context, sessionID string) (*cache.CachedSession, error) {
	// 1. Check Redis
	cached, err := s.cache.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if cached != nil {
		return cached, nil
	}

	// 2. Fallback to DB (If not in Redis but theoretically valid?)
	// If we align Redis TTL with AccessToken expiry, then missing in Redis means "AccessToken Expired".
	// Client should use Refresh Token.
	// However, if Redis was flushed, we might want to reload from DB if strictly within RefreshTTL?
	// Requirement says: "Validate sessions -> Redis first, fallback to DB only if needed"
	// This implies we SHOULD check DB.

	session, err := s.store.GetSession(sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Invalid
		}
		return nil, err
	}

	if session.IsRevoked {
		return nil, nil // Revoked
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, nil // Expired
	}
	// Check if "Access" is expired? DB stores "Refresh" expiry.
	// We can't know if access is "expired" just by DB unless we store separated access expiry.
	// But usually DB record is for the long-lived session.
	// If we allow fallback, we effectively extend "fast access" to the DB lifetime.
	// Let's re-cache it if valid in DB.

	if err := s.cache.SetSession(ctx, session, AccessTokenTTL); err != nil {
		// Log error
	}

	return &cache.CachedSession{
		ID:        session.ID,
		UserID:    session.UserID,
		UserRole:  session.UserRole,
		UserAgent: session.UserAgent,
		ClientIP:  session.ClientIP,
		ExpiresAt: session.ExpiresAt, // This is technically refresh expiry
	}, nil
}

func (s *SessionService) RefreshSession(ctx context.Context, sessionID, refreshToken string) (*SessionTokens, error) {
	// 1. Get from DB (Source of truth for refresh token)
	session, err := s.store.GetSession(sessionID)
	if err != nil {
		return nil, models.ErrInvalidSession
	}

	if session.IsRevoked {
		// Potential theft, maybe revoke user sessions?
		return nil, models.ErrSessionRevoked
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, models.ErrSessionExpired
	}

	// 2. Verify Refresh Token
	if err := compareToken(session.RefreshToken, refreshToken); err != nil {
		return nil, models.ErrInvalidToken
	}

	// 3. Rotate Refresh Token
	newRefreshTokenRaw := generateSecureToken(RefreshTokenLength)
	newHashedToken, err := hashToken(newRefreshTokenRaw)
	if err != nil {
		return nil, err
	}

	// 4. Update DB
	// We could also extend expiry here if we want "sliding window" for refresh token
	if err := s.store.UpdateSessionRefreshToken(sessionID, newHashedToken); err != nil {
		return nil, err
	}

	// Update session object for caching
	session.RefreshToken = newHashedToken

	// 5. Update Redis
	if err := s.cache.SetSession(ctx, session, AccessTokenTTL); err != nil {
		return nil, err
	}

	return &SessionTokens{
		SessionID:    sessionID,
		RefreshToken: newRefreshTokenRaw,
		ExpiresAt:    time.Now().Add(AccessTokenTTL),
	}, nil
}

func (s *SessionService) RevokeSession(ctx context.Context, sessionID, userID string) error {
	// 0. If UserID is missing, try to find it from Cache or DB
	if userID == "" {
		// Try Cache first
		cached, _ := s.cache.GetSession(ctx, sessionID)
		if cached != nil {
			userID = cached.UserID
		} else {
			// Try DB
			session, err := s.store.GetSession(sessionID)
			if err == nil {
				userID = session.UserID
			}
		}
	}

	// 1. Remove from Redis (requires userID to clear the set)
	if err := s.cache.DeleteSession(ctx, sessionID, userID); err != nil {
		return err
	}
	// 2. Mark in DB
	return s.store.RevokeSession(sessionID)
}

func (s *SessionService) RevokeUserSessions(ctx context.Context, userID string) error {
	// 1. Remove from Redis
	if err := s.cache.DeleteUserSessions(ctx, userID); err != nil {
		return err
	}
	// 2. Mark in DB
	return s.store.RevokeUserSessions(userID)
}

// Helpers

func generateSecureToken(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return base64.URLEncoding.EncodeToString(b)
}

func hashToken(token string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	return string(bytes), err
}

func compareToken(hashed, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain))
}
