package models

import (
	"time"

	"gorm.io/gorm"
)

// Institute represents an educational institution
type Institute struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	Name        string         `gorm:"not null" json:"name" validate:"required"`
	Code        string         `gorm:"uniqueIndex;not null" json:"code" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Faculties []Faculty `gorm:"foreignKey:InstituteID;constraint:OnDelete:CASCADE" json:"faculties,omitempty"`
}

// Faculty represents a faculty within an institute
type Faculty struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	InstituteID uint           `gorm:"not null;index" json:"institute_id" validate:"required"`
	Name        string         `gorm:"not null" json:"name" validate:"required"`
	Code        string         `gorm:"not null" json:"code" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Institute   *Institute   `gorm:"foreignKey:InstituteID" json:"institute,omitempty"`
	Departments []Department `gorm:"foreignKey:FacultyID;constraint:OnDelete:CASCADE" json:"departments,omitempty"`
}

// Department represents a department within a faculty
type Department struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	FacultyID   uint           `gorm:"not null;index" json:"faculty_id" validate:"required"`
	Name        string         `gorm:"not null" json:"name" validate:"required"`
	Code        string         `gorm:"not null" json:"code" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Faculty *Faculty `gorm:"foreignKey:FacultyID" json:"faculty,omitempty"`
	Classes []Class  `gorm:"foreignKey:DepartmentID;constraint:OnDelete:CASCADE" json:"classes,omitempty"`
}

// Class represents a class within a department
type Class struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	DepartmentID uint           `gorm:"not null;index" json:"department_id" validate:"required"`
	Name         string         `gorm:"not null" json:"name" validate:"required"`
	Code         string         `gorm:"not null" json:"code" validate:"required"`
	Year         int            `gorm:"not null" json:"year" validate:"required,min=1,max=10"`
	Semester     int            `gorm:"not null" json:"semester" validate:"required,min=1,max=2"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Department *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
}
