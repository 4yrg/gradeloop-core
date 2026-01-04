package models

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleSystemAdmin    Role = "system-admin"
	RoleInstituteAdmin Role = "institute-admin"
	RoleStudent        Role = "student"
	RoleInstructor     Role = "instructor"
)

type User struct {
	ID                   uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email                string     `gorm:"uniqueIndex" json:"email"`
	Name                 string     `json:"name"`
	PasswordHash         string     `gorm:"not null" json:"-"`
	Role                 Role       `gorm:"type:varchar(20)" json:"role"`
	PasswordResetToken   *string    `json:"-"`
	PasswordResetExpires *time.Time `json:"-"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"required,min=2"`
	Password string `json:"password" validate:"required,min=6"`
	Role     Role   `json:"role" validate:"required,oneof=system-admin institute-admin student instructor"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=6"`
}
