package models

import (
	"time"

	"gorm.io/gorm"
)

type Session struct {
	ID           string    `gorm:"primaryKey;type:varchar(64)" json:"id"` // Secure Random ID
	UserID       string    `gorm:"index;not null" json:"user_id"`
	UserRole     string    `gorm:"not null" json:"user_role"`
	RefreshToken string    `gorm:"not null" json:"-"` // Hashed, never return in JSON
	UserAgent    string    `json:"user_agent"`
	ClientIP     string    `json:"client_ip"`
	IsRevoked    bool      `gorm:"default:false;index" json:"is_revoked"`
	ExpiresAt    time.Time `gorm:"index;not null" json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// BeforeCreate hook to ensure timestamps and ID presence
func (s *Session) BeforeCreate(tx *gorm.DB) (err error) {
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}
	if s.UpdatedAt.IsZero() {
		s.UpdatedAt = time.Now()
	}
	return
}
