package service

import (
	"fmt"
	"log"

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
	log.Printf("[SERVICE] Starting user creation for email: %s, type: %s", user.Email, user.UserType)

	// Validate user
	log.Printf("[SERVICE] Validating base user struct")
	if err := s.validate.Struct(user); err != nil {
		log.Printf("[SERVICE ERROR] Base user validation failed: %v", err)
		return fmt.Errorf("validation error: %w", err)
	}

	// Check if user already exists by email
	log.Printf("[SERVICE] Checking if user already exists with email: %s", user.Email)
	existingUser, err := s.userRepo.GetByEmail(user.Email)
	if err == nil && existingUser != nil {
		log.Printf("[SERVICE ERROR] User already exists with email: %s", user.Email)
		return fmt.Errorf("user with email %s already exists", user.Email)
	}

	// Validate user-specific fields
	log.Printf("[SERVICE] Validating type-specific data for user_type: %s", user.UserType)
	switch user.UserType {
	case models.UserTypeStudent:
		if user.Student == nil {
			log.Printf("[SERVICE ERROR] Student data is nil for student user type")
			return fmt.Errorf("student data is required for student user type")
		}
		log.Printf("[SERVICE] Validating student data: %+v", user.Student)
		if err := s.validate.Struct(user.Student); err != nil {
			log.Printf("[SERVICE ERROR] Student validation failed: %v", err)
			return fmt.Errorf("student validation error: %w", err)
		}
	case models.UserTypeInstructor:
		if user.Instructor == nil {
			log.Printf("[SERVICE ERROR] Instructor data is nil for instructor user type")
			return fmt.Errorf("instructor data is required for instructor user type")
		}
		log.Printf("[SERVICE] Validating instructor data: %+v", user.Instructor)
		if err := s.validate.Struct(user.Instructor); err != nil {
			log.Printf("[SERVICE ERROR] Instructor validation failed: %v", err)
			return fmt.Errorf("instructor validation error: %w", err)
		}
	case models.UserTypeInstituteAdmin:
		if user.InstituteAdmin == nil {
			log.Printf("[SERVICE ERROR] InstituteAdmin data is nil for institute admin user type")
			return fmt.Errorf("institute admin data is required for institute admin user type")
		}
		log.Printf("[SERVICE] Validating institute admin data: %+v", user.InstituteAdmin)
		if err := s.validate.Struct(user.InstituteAdmin); err != nil {
			log.Printf("[SERVICE ERROR] InstituteAdmin validation failed: %v", err)
			return fmt.Errorf("institute admin validation error: %w", err)
		}
	}

	log.Printf("[SERVICE] All validations passed, calling repository.Create")
	err = s.userRepo.Create(user)
	if err != nil {
		log.Printf("[SERVICE ERROR] Repository create failed: %v", err)
		return err
	}

	log.Printf("[SERVICE SUCCESS] User created successfully with ID: %d, email: %s", user.ID, user.Email)
	return nil
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
	log.Printf("[SERVICE] Validating credentials for email: %s", email)
	user, err := s.userRepo.GetByEmail(email)
	if err != nil {
		log.Printf("[SERVICE ERROR] Failed to get user by email %s: %v", email, err)
		return nil, false, err
	}
	// If user not found, GetByEmail might return nil, nil depending on repo implementation.
	// Assuming it returns nil, nil or error if not found.
	if user == nil {
		log.Printf("[SERVICE] User not found with email: %s", email)
		return nil, false, nil
	}

	log.Printf("[SERVICE] User found (ID: %d), comparing password hash", user.ID)
	log.Printf("[SERVICE] Stored hash length: %d bytes, provided password length: %d chars",
		len(user.PasswordHash), len(password))

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		log.Printf("[SERVICE] Password mismatch for email: %s, error: %v", email, err)
		log.Printf("[SERVICE] Hash comparison failed - stored hash starts with: %.20s...", user.PasswordHash)
		return nil, false, nil
	}

	log.Printf("[SERVICE SUCCESS] Credentials validated for user ID: %d, email: %s", user.ID, email)
	return user, true, nil
}

func (s *userService) UpdatePassword(userID uint, password string) error {
	log.Printf("[SERVICE] Updating password for user ID: %d", userID)

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[SERVICE ERROR] Failed to hash password for user ID %d: %v", userID, err)
		return fmt.Errorf("failed to hash password: %w", err)
	}

	log.Printf("[SERVICE] Generated password hash for user ID: %d (length: %d bytes)", userID, len(hashedPassword))

	// Verify user exists first
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		log.Printf("[SERVICE ERROR] Failed to get user by ID %d: %v", userID, err)
		return err
	}

	log.Printf("[SERVICE] Found user with email: %s, current hash length: %d", user.Email, len(user.PasswordHash))

	// Use dedicated method to update only the password hash field
	err = s.userRepo.UpdatePasswordHash(userID, string(hashedPassword))
	if err != nil {
		log.Printf("[SERVICE ERROR] Failed to update password hash for ID %d: %v", userID, err)
		return err
	}

	// Verify the password was updated correctly
	updatedUser, err := s.userRepo.GetByID(userID)
	if err != nil {
		log.Printf("[SERVICE WARNING] Could not verify password update: %v", err)
	} else {
		log.Printf("[SERVICE] Verification - Updated hash length: %d", len(updatedUser.PasswordHash))
		// Test if the new password works
		if err := bcrypt.CompareHashAndPassword([]byte(updatedUser.PasswordHash), []byte(password)); err != nil {
			log.Printf("[SERVICE ERROR] Password verification failed after update! Hash mismatch.")
			return fmt.Errorf("password update verification failed")
		}
		log.Printf("[SERVICE] Password verification successful!")
	}

	log.Printf("[SERVICE SUCCESS] Password updated successfully for user ID: %d", userID)
	return nil
}
