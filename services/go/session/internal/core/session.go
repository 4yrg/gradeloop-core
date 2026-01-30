package core

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Session represents a user session.
type Session struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key;" json:"id"`
	UserID           string     `gorm:"index" json:"user_id"`
	UserRole         string     `json:"user_role"`
	RefreshTokenHash string     `json:"-"` // Never return hash
	UserAgent        string     `json:"user_agent"`
	ClientIP         string     `json:"client_ip"`
	RotationCounter  int        `json:"rotation_counter"`
	CreatedAt        time.Time  `json:"created_at"`
	ExpiresAt        time.Time  `json:"expires_at"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
}

// IsExpired checks if the session is expired.
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsRevoked checks if the session is revoked.
func (s *Session) IsRevoked() bool {
	return s.RevokedAt != nil
}

// SessionRepository defines the interface for persistent session storage (SQLite).
type SessionRepository interface {
	Create(ctx context.Context, session *Session) error
	GetByID(ctx context.Context, id uuid.UUID) (*Session, error)
	GetActiveByUserID(ctx context.Context, userID string) ([]*Session, error)
	Update(ctx context.Context, session *Session) error
	Revoke(ctx context.Context, id uuid.UUID) error
	RevokeAllForUser(ctx context.Context, userID string) error
}

// SessionCache defines the interface for fast session access (Redis).
type SessionCache interface {
	Set(ctx context.Context, session *Session) error
	Get(ctx context.Context, id uuid.UUID) (*Session, error)
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteAllForUser(ctx context.Context, userID string) error
}

// SessionUseCase defines the business logic for session management.
type SessionUseCase interface {
	CreateSession(ctx context.Context, userID, role, ip, userAgent string) (*Session, string, error) // Returns session and raw refresh token
	ValidateSession(ctx context.Context, sessionID uuid.UUID) (*Session, error)
	RefreshSession(ctx context.Context, sessionID uuid.UUID, refreshToken string) (*Session, string, error) // Rotates token
	RevokeSession(ctx context.Context, sessionID uuid.UUID) error
	RevokeAllUserSessions(ctx context.Context, userID string) error
}
