package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleSystemAdmin    Role = "SYSTEM_ADMIN"
	RoleInstituteAdmin Role = "INSTITUTE_ADMIN"
	RoleInstructor     Role = "INSTRUCTOR"
	RoleStudent        Role = "STUDENT"
)

type User struct {
	ID            uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email         string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash  string         `json:"-"`
	Role          Role           `gorm:"type:string;not null" json:"role"`
	InstituteID   *uuid.UUID     `gorm:"type:uuid" json:"institute_id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

type Institute struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
