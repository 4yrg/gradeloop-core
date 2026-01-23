package service

import (
	"fmt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/go-playground/validator/v10"
)

type MembershipService interface {
	CreateMembership(membership *models.StudentMembership) error
	GetMembershipsByStudentID(studentID string) ([]models.StudentMembership, error)
	GetCurrentMembershipByStudentID(studentID string) (*models.StudentMembership, error)
	TransferStudent(studentID, newFacultyID, newDepartmentID, newClassID string) error
	EndMembership(membershipID string) error
}

type membershipService struct {
	membershipRepo repository.MembershipRepository
	validate       *validator.Validate
}

func NewMembershipService(membershipRepo repository.MembershipRepository) MembershipService {
	return &membershipService{
		membershipRepo: membershipRepo,
		validate:       validator.New(),
	}
}

func (s *membershipService) CreateMembership(membership *models.StudentMembership) error {
	if err := s.validate.Struct(membership); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.membershipRepo.Create(membership)
}

func (s *membershipService) GetMembershipsByStudentID(studentID string) ([]models.StudentMembership, error) {
	return s.membershipRepo.GetByStudentID(studentID)
}

func (s *membershipService) GetCurrentMembershipByStudentID(studentID string) (*models.StudentMembership, error) {
	return s.membershipRepo.GetCurrentByStudentID(studentID)
}

func (s *membershipService) TransferStudent(studentID, newFacultyID, newDepartmentID, newClassID string) error {
	return s.membershipRepo.TransferStudent(studentID, newFacultyID, newDepartmentID, newClassID)
}

func (s *membershipService) EndMembership(membershipID string) error {
	// This is a custom method to manually end a membership
	// In practice, this would be implemented in the repository
	// For now, we'll return an error indicating it needs implementation
	return fmt.Errorf("end membership not yet implemented")
}
