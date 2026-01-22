package service

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/go-playground/validator/v10"
)

type UserService interface {
	CreateUser(user *models.User) error
	GetUserByID(id uint) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	GetAllUsers(limit, offset int) ([]models.User, int64, error)
	UpdateUser(user *models.User) error
	DeleteUser(id uint) error
	AssignRolesToUser(userID uint, roleIDs []uint) error
	ValidateCredentials(email, password string) (*models.User, bool, error)
	UpdatePassword(userID uint, password string) error
}

type userService struct {
	userRepo repository.UserRepository
	validate *validator.Validate
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
		validate: validator.New(),
	}
}

func (s *userService) CreateUser(user *models.User) error {
	// Validate user
	if err := s.validate.Struct(user); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}

	// Check if user already exists by email
	existingUser, err := s.userRepo.GetByEmail(user.Email)
	if err == nil && existingUser != nil {
		return fmt.Errorf("user with email %s already exists", user.Email)
	}

	// Validate user-specific fields
	switch user.UserType {
	case models.UserTypeStudent:
		if user.Student == nil {
			return fmt.Errorf("student data is required for student user type")
		}
		if err := s.validate.Struct(user.Student); err != nil {
			return fmt.Errorf("student validation error: %w", err)
		}
	case models.UserTypeInstructor:
		if user.Instructor == nil {
			return fmt.Errorf("instructor data is required for instructor user type")
		}
		if err := s.validate.Struct(user.Instructor); err != nil {
			return fmt.Errorf("instructor validation error: %w", err)
		}
	case models.UserTypeInstituteAdmin:
		if user.InstituteAdmin == nil {
			return fmt.Errorf("institute admin data is required for institute admin user type")
		}
		if err := s.validate.Struct(user.InstituteAdmin); err != nil {
			return fmt.Errorf("institute admin validation error: %w", err)
		}
	}

	return s.userRepo.Create(user)
}

func (s *userService) GetUserByID(id uint) (*models.User, error) {
	return s.userRepo.GetByID(id)
}

func (s *userService) GetUserByEmail(email string) (*models.User, error) {
	return s.userRepo.GetByEmail(email)
}

func (s *userService) GetAllUsers(limit, offset int) ([]models.User, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.userRepo.GetAll(limit, offset)
}

func (s *userService) UpdateUser(user *models.User) error {
	if err := s.validate.Struct(user); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}

	return s.userRepo.Update(user)
}

func (s *userService) DeleteUser(id uint) error {
	return s.userRepo.Delete(id)
}

func (s *userService) AssignRolesToUser(userID uint, roleIDs []uint) error {
	// Verify user exists
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	return s.userRepo.AssignRoles(userID, roleIDs)
}

func (s *userService) ValidateCredentials(email, password string) (*models.User, bool, error) {
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return nil, false, err
	}
	// If user not found, GetByEmail might return nil, nil depending on repo implementation.
	// Assuming it returns nil, nil or error if not found.
	if user == nil {
		return nil, false, nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, false, nil
	}

	return user, true, nil
}

func (s *userService) UpdatePassword(userID uint, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return s.userRepo.Update(user)
}
