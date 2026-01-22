package models

import (
	"gorm.io/gorm"
)

// StudentMembership tracks student's association with faculty, department, and class
// This allows for historical tracking as students can change classes/departments
type StudentMembership struct {
	ID           uint          `gorm:"primarykey" json:"id"`
	StudentID    uint          `gorm:"not null;index" json:"student_id" validate:"required"`
	FacultyID    uint          `gorm:"not null;index" json:"faculty_id" validate:"required"`
	DepartmentID uint          `gorm:"not null;index" json:"department_id" validate:"required"`
	ClassID      uint          `gorm:"not null;index" json:"class_id" validate:"required"`
	StartDate    FlexibleTime  `gorm:"not null" json:"start_date" validate:"required"`
	EndDate      *FlexibleTime `json:"end_date"`
	IsCurrent    bool          `gorm:"default:true;index" json:"is_current"`
	CreatedAt    FlexibleTime  `json:"created_at"`
	UpdatedAt    FlexibleTime  `json:"updated_at"`

	Student    *Student    `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Faculty    *Faculty    `gorm:"foreignKey:FacultyID" json:"faculty,omitempty"`
	Department *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Class      *Class      `gorm:"foreignKey:ClassID" json:"class,omitempty"`
}

// BeforeCreate ensures only one current membership per student
func (sm *StudentMembership) BeforeCreate(tx *gorm.DB) error {
	if sm.IsCurrent {
		// Set all previous memberships as not current
		return tx.Model(&StudentMembership{}).
			Where("student_id = ? AND is_current = ?", sm.StudentID, true).
			Update("is_current", false).Error
	}
	return nil
}
