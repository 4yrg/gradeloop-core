package sqlite

import (
	"context"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/session/internal/core"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(ctx context.Context, session *core.Session) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *SessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*core.Session, error) {
	var session core.Session
	if err := r.db.WithContext(ctx).First(&session, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) GetActiveByUserID(ctx context.Context, userID string) ([]*core.Session, error) {
	var sessions []*core.Session
	// Get sessions that are not revoked and not expired
	if err := r.db.WithContext(ctx).Where("user_id = ? AND revoked_at IS NULL AND expires_at > ?", userID, time.Now()).Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *SessionRepository) Update(ctx context.Context, session *core.Session) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *SessionRepository) Revoke(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	// Update revocation time if not already revoked
	return r.db.WithContext(ctx).Model(&core.Session{}).Where("id = ? AND revoked_at IS NULL", id).Update("revoked_at", now).Error
}

func (r *SessionRepository) RevokeAllForUser(ctx context.Context, userID string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&core.Session{}).Where("user_id = ? AND revoked_at IS NULL", userID).Update("revoked_at", now).Error
}
