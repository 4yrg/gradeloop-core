package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role represents a role in the system for RBAC
type Role struct {
	ID          string         `gorm:"primarykey" json:"id"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   FlexibleTime   `json:"created_at"`
	UpdatedAt   FlexibleTime   `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Users []User `gorm:"many2many:user_roles;" json:"users,omitempty"`
}

func (r *Role) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return
}

// UserRole is the join table for many-to-many relationship between User and Role
type UserRole struct {
	UserID    string       `gorm:"primarykey" json:"user_id"`
	RoleID    string       `gorm:"primarykey" json:"role_id"`
	CreatedAt FlexibleTime `json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role *Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}
