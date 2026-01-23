package models

import (
	"github.com/google/uuid"
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
	ID           string         `gorm:"primarykey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email" validate:"required,email"`
	Name         string         `gorm:"not null" json:"name" validate:"required"`
	UserType     UserType       `gorm:"type:varchar(50);not null" json:"user_type" validate:"required,oneof=system_admin institute_admin student instructor"`
	PasswordHash string         `gorm:"type:varchar(255)" json:"-"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    FlexibleTime   `json:"created_at"`
	UpdatedAt    FlexibleTime   `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships - loaded based on UserType
	Student        *Student        `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"student,omitempty"`
	Instructor     *Instructor     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"instructor,omitempty"`
	SystemAdmin    *SystemAdmin    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"system_admin,omitempty"`
	InstituteAdmin *InstituteAdmin `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"institute_admin,omitempty"`
	Roles          []Role          `gorm:"many2many:user_roles;" json:"roles,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return
}

// Student holds student-specific fields
type Student struct {
	ID        string       `gorm:"primarykey" json:"id"`
	UserID    string       `gorm:"uniqueIndex;not null" json:"user_id"`
	StudentID string       `gorm:"uniqueIndex;not null" json:"student_id" validate:"required"`
	CreatedAt FlexibleTime `json:"created_at"`
	UpdatedAt FlexibleTime `json:"updated_at"`

	// Current membership (loaded separately)
	CurrentMembership *StudentMembership  `gorm:"-" json:"current_membership,omitempty"`
	Memberships       []StudentMembership `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"memberships,omitempty"`
}

func (s *Student) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return
}

// Instructor holds instructor-specific fields
type Instructor struct {
	ID         string       `gorm:"primarykey" json:"id"`
	UserID     string       `gorm:"uniqueIndex;not null" json:"user_id"`
	EmployeeID string       `gorm:"uniqueIndex;not null" json:"employee_id" validate:"required"`
	CreatedAt  FlexibleTime `json:"created_at"`
	UpdatedAt  FlexibleTime `json:"updated_at"`
}

func (i *Instructor) BeforeCreate(tx *gorm.DB) (err error) {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return
}

// SystemAdmin holds system admin specific fields
type SystemAdmin struct {
	ID        string       `gorm:"primarykey" json:"id"`
	UserID    string       `gorm:"uniqueIndex;not null" json:"user_id"`
	CreatedAt FlexibleTime `json:"created_at"`
	UpdatedAt FlexibleTime `json:"updated_at"`
}

func (sa *SystemAdmin) BeforeCreate(tx *gorm.DB) (err error) {
	if sa.ID == "" {
		sa.ID = uuid.New().String()
	}
	return
}

// InstituteAdmin holds institute admin specific fields
type InstituteAdmin struct {
	ID          string       `gorm:"primarykey" json:"id"`
	UserID      string       `gorm:"uniqueIndex;not null" json:"user_id"`
	InstituteID string       `gorm:"not null" json:"institute_id"`
	CreatedAt   FlexibleTime `json:"created_at"`
	UpdatedAt   FlexibleTime `json:"updated_at"`

	Institute *Institute `gorm:"foreignKey:InstituteID" json:"institute,omitempty"`
}

func (ia *InstituteAdmin) BeforeCreate(tx *gorm.DB) (err error) {
	if ia.ID == "" {
		ia.ID = uuid.New().String()
	}
	return
}
