package store

import (
	"fmt"

	"github.com/glebarez/sqlite" // Pure go sqlite
	"github.com/gradeloop/session-service/internal/config"
	"github.com/gradeloop/session-service/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Store struct {
	DB *gorm.DB
}

func New(cfg *config.Config) (*Store, error) {
	var dialector gorm.Dialector

	if cfg.DBDriver == "postgres" {
		dialector = postgres.Open(cfg.DBDSN)
	} else {
		// Use pure go sqlite
		dialector = sqlite.Open(cfg.DBDSN)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto Migration
	if err := db.AutoMigrate(&models.Session{}); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return &Store{DB: db}, nil
}

// CreateSession creates a new session in the database
func (s *Store) CreateSession(session *models.Session) error {
	return s.DB.Create(session).Error
}

// GetSession retrieves a session by ID
func (s *Store) GetSession(id string) (*models.Session, error) {
	var session models.Session
	if err := s.DB.First(&session, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

// RevokeSession marks a session as revoked
func (s *Store) RevokeSession(id string) error {
	return s.DB.Model(&models.Session{}).Where("id = ?", id).Update("is_revoked", true).Error
}

// RevokeUserSessions revokes all sessions for a specific user
func (s *Store) RevokeUserSessions(userID string) error {
	return s.DB.Model(&models.Session{}).Where("user_id = ?", userID).Update("is_revoked", true).Error
}

// UpdateSessionRefreshToken updates the refresh token and expires_at
func (s *Store) UpdateSessionRefreshToken(id, newRefreshToken string) error {
	return s.DB.Model(&models.Session{}).Where("id = ?", id).Updates(map[string]interface{}{
		"refresh_token": newRefreshToken,
	}).Error
}
