package service

import (
	"errors"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type IdentityService struct {
	repo *repository.Repository
}

func NewIdentityService(repo *repository.Repository) *IdentityService {
	return &IdentityService{repo: repo}
}

type CreateUserRequest struct {
	Email    string        `json:"email"`
	Password string        `json:"password"`
	FullName string        `json:"full_name"`
	UserType core.UserType `json:"user_type"`

	// Profile fields (simplified for request)
	// In a real app, these might be nested objects or specific request types
	EnrollmentNumber string `json:"enrollment_number,omitempty"` // For Student
	EmployeeID       string `json:"employee_id,omitempty"`       // For Instructor
	InstituteID      string `json:"institute_id,omitempty"`      // For Institute Admin
}

func (s *IdentityService) RegisterUser(req CreateUserRequest) (*core.User, error) {
	// 1. Hash Password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &core.User{
		Email:        req.Email,
		PasswordHash: string(hashedBytes),
		FullName:     req.FullName,
		UserType:     req.UserType,
		IsActive:     true,
	}

	// 2. Build Profile based on Type
	switch req.UserType {
	case core.UserTypeStudent:
		user.StudentProfile = &core.StudentProfile{
			EnrollmentNumber: req.EnrollmentNumber,
			// EnrollmentYear default?
		}
	case core.UserTypeInstructor:
		user.InstructorProfile = &core.InstructorProfile{
			EmployeeID: req.EmployeeID,
		}
	case core.UserTypeInstituteAdmin:
		// Parse uuid
		// user.InstituteAdminProfile = ...
	}

	// 3. Save
	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *IdentityService) ValidateCredentials(email, password string) (*core.User, bool, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, false, nil
		}
		return nil, false, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, false, nil
	}

	return user, true, nil
}
