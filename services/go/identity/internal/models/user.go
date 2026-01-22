package models

import (
	"time"

	"gorm.io/gorm"
)

// UserType represents the type of user in the system
type UserType string

const (
	UserTypeSystemAdmin    UserType = "system_admin"
	UserTypeInstituteAdmin UserType = "institute_admin"
	UserTypeStudent        UserType = "student"
	UserTypeInstructor     UserType = "instructor"
)

// User is the base user model with common fields
type User struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email" validate:"required,email"`
	Name      string         `gorm:"not null" json:"name" validate:"required"`
	UserType  UserType       `gorm:"type:varchar(50);not null" json:"user_type" validate:"required,oneof=system_admin institute_admin student instructor"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships - loaded based on UserType
	Student        *Student        `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"student,omitempty"`
	Instructor     *Instructor     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"instructor,omitempty"`
	SystemAdmin    *SystemAdmin    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"system_admin,omitempty"`
	InstituteAdmin *InstituteAdmin `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"institute_admin,omitempty"`
	Roles          []Role          `gorm:"many2many:user_roles;" json:"roles,omitempty"`
}

// Student holds student-specific fields
type Student struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	StudentID string    `gorm:"uniqueIndex;not null" json:"student_id" validate:"required"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Current membership (loaded separately)
	CurrentMembership *StudentMembership `gorm:"-" json:"current_membership,omitempty"`
	Memberships       []StudentMembership `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"memberships,omitempty"`
}

// Instructor holds instructor-specific fields
type Instructor struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	UserID     uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	EmployeeID string    `gorm:"uniqueIndex;not null" json:"employee_id" validate:"required"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// SystemAdmin holds system admin specific fields
type SystemAdmin struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// InstituteAdmin holds institute admin specific fields
type InstituteAdmin struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	UserID      uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	InstituteID uint      `gorm:"not null" json:"institute_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Institute *Institute `gorm:"foreignKey:InstituteID" json:"institute,omitempty"`
}
