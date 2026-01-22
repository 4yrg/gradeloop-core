package repository

import (
	"errors"
	"fmt"
	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"gorm.io/gorm"
)

type MembershipRepository interface {
	Create(membership *models.StudentMembership) error
	GetByStudentID(studentID uint) ([]models.StudentMembership, error)
	GetCurrentByStudentID(studentID uint) (*models.StudentMembership, error)
	TransferStudent(studentID, newFacultyID, newDepartmentID, newClassID uint) error
}

type membershipRepository struct {
	db *gorm.DB
}

func NewMembershipRepository(db *gorm.DB) MembershipRepository {
	return &membershipRepository{db: db}
}

func (r *membershipRepository) Create(membership *models.StudentMembership) error {
	return r.db.Create(membership).Error
}

func (r *membershipRepository) GetByStudentID(studentID uint) ([]models.StudentMembership, error) {
	var memberships []models.StudentMembership
	err := r.db.Where("student_id = ?", studentID).
		Preload("Faculty").
		Preload("Department").
		Preload("Class").
		Order("start_date DESC").
		Find(&memberships).Error

	return memberships, err
}

func (r *membershipRepository) GetCurrentByStudentID(studentID uint) (*models.StudentMembership, error) {
	var membership models.StudentMembership
	err := r.db.Where("student_id = ? AND is_current = ?", studentID, true).
		Preload("Faculty").
		Preload("Department").
		Preload("Class").
		First(&membership).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("no current membership found")
		}
		return nil, err
	}

	return &membership, nil
}

func (r *membershipRepository) TransferStudent(studentID, newFacultyID, newDepartmentID, newClassID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// End the current membership
		now := time.Now()
		flexNow := models.FlexibleTime(now)
		err := tx.Model(&models.StudentMembership{}).
			Where("student_id = ? AND is_current = ?", studentID, true).
			Updates(map[string]interface{}{
				"is_current": false,
				"end_date":   &flexNow,
			}).Error

		if err != nil {
			return err
		}

		// Create new membership
		newMembership := &models.StudentMembership{
			StudentID:    studentID,
			FacultyID:    newFacultyID,
			DepartmentID: newDepartmentID,
			ClassID:      newClassID,
			StartDate:    models.FlexibleTime(now),
			IsCurrent:    true,
		}

		return tx.Create(newMembership).Error
	})
}
