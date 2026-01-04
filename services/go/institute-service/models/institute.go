package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Institute struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Code      string         `gorm:"uniqueIndex;not null" json:"code"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type InstituteAdmin struct {
	InstituteID string `gorm:"primaryKey" json:"institute_id"`
	UserID      string `gorm:"primaryKey" json:"user_id"`
	// We store IDs as strings or UUIDs. If UUIDs, we need to import google/uuid and parse them.
	// For simplicity with gRPC strings, we can store as string or use UUID type.
	// Let's use string to match gRPC, but ideally UUID in DB.
	// Let's stick to string for now to avoid parsing overhead unless necessary for DB constraints.
	// Actually, DB constraints enforce UUID. So we should use UUID type if possible or string with UUID type in DB.
}
