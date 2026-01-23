package repository

import (
	"errors"
	"fmt"
	"log"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.User) error
	GetByID(id string) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetAll(limit, offset int) ([]models.User, int64, error)
	Update(user *models.User) error
	UpdatePasswordHash(userID string, passwordHash string) error
	Delete(id string) error
	AssignRoles(userID string, roleIDs []string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	log.Printf("[REPO] Starting user creation transaction for email: %s, type: %s", user.Email, user.UserType)

	return r.db.Transaction(func(tx *gorm.DB) error {
		// Create the base user
		log.Printf("[REPO] Creating base user record for email: %s", user.Email)
		if err := tx.Create(user).Error; err != nil {
			log.Printf("[REPO ERROR] Failed to create base user: %v", err)
			return fmt.Errorf("failed to create user: %w", err)
		}
		log.Printf("[REPO] Base user created with ID: %s", user.ID)

		// Before creating type-specific records, check if one already exists (from a failed previous transaction)
		// and clean it up if found
		switch user.UserType {
		case models.UserTypeStudent:
			// Check for orphaned student record
			log.Printf("[REPO] Checking for orphaned student record for user_id: %s", user.ID)
			var existingStudent models.Student
			if err := tx.Where("user_id = ?", user.ID).First(&existingStudent).Error; err == nil {
				// Orphaned student record exists, delete it
				log.Printf("[REPO] Found orphaned student record, deleting...")
				if err := tx.Delete(&existingStudent).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to clean up orphaned student: %v", err)
					return fmt.Errorf("failed to clean up orphaned student record for user_id %s: %w", user.ID, err)
				}
			}
		case models.UserTypeInstructor:
			// Check for orphaned instructor record
			log.Printf("[REPO] Checking for orphaned instructor record for user_id: %s", user.ID)
			var existingInstructor models.Instructor
			if err := tx.Where("user_id = ?", user.ID).First(&existingInstructor).Error; err == nil {
				// Orphaned instructor record exists, delete it
				log.Printf("[REPO] Found orphaned instructor record, deleting...")
				if err := tx.Delete(&existingInstructor).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to clean up orphaned instructor: %v", err)
					return fmt.Errorf("failed to clean up orphaned instructor record for user_id %s: %w", user.ID, err)
				}
			}
		case models.UserTypeSystemAdmin:
			// Check for orphaned system admin record
			log.Printf("[REPO] Checking for orphaned system admin record for user_id: %s", user.ID)
			var existingSysAdmin models.SystemAdmin
			if err := tx.Where("user_id = ?", user.ID).First(&existingSysAdmin).Error; err == nil {
				// Orphaned system admin record exists, delete it
				log.Printf("[REPO] Found orphaned system admin record, deleting...")
				if err := tx.Delete(&existingSysAdmin).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to clean up orphaned system admin: %v", err)
					return fmt.Errorf("failed to clean up orphaned system admin record for user_id %s: %w", user.ID, err)
				}
			}
		case models.UserTypeInstituteAdmin:
			// Check for orphaned institute admin record
			log.Printf("[REPO] Checking for orphaned institute admin record for user_id: %s", user.ID)
			var existingInstAdmin models.InstituteAdmin
			if err := tx.Where("user_id = ?", user.ID).First(&existingInstAdmin).Error; err == nil {
				// Orphaned institute admin record exists, delete it
				log.Printf("[REPO] Found orphaned institute admin record, deleting...")
				if err := tx.Delete(&existingInstAdmin).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to clean up orphaned institute admin: %v", err)
					return fmt.Errorf("failed to clean up orphaned institute admin record for user_id %s: %w", user.ID, err)
				}
			}
		}

		// Create type-specific record
		log.Printf("[REPO] Creating type-specific record for user_type: %s", user.UserType)
		switch user.UserType {
		case models.UserTypeStudent:
			if user.Student != nil {
				user.Student.UserID = user.ID
				log.Printf("[REPO] Creating student record with StudentID: %s for user_id: %s", user.Student.StudentID, user.ID)
				if err := tx.Create(user.Student).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to create student record: %v", err)
					return fmt.Errorf("failed to create student record for user_id %s: %w", user.ID, err)
				}
				log.Printf("[REPO] Student record created with ID: %s", user.Student.ID)
			} else {
				log.Printf("[REPO WARNING] Student data is nil for user_type student")
			}
		case models.UserTypeInstructor:
			if user.Instructor != nil {
				user.Instructor.UserID = user.ID
				log.Printf("[REPO] Creating instructor record with EmployeeID: %s for user_id: %s", user.Instructor.EmployeeID, user.ID)
				if err := tx.Create(user.Instructor).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to create instructor record: %v", err)
					return fmt.Errorf("failed to create instructor record for user_id %s: %w", user.ID, err)
				}
				log.Printf("[REPO] Instructor record created with ID: %s", user.Instructor.ID)
			} else {
				log.Printf("[REPO WARNING] Instructor data is nil for user_type instructor")
			}
		case models.UserTypeSystemAdmin:
			log.Printf("[REPO] Creating system admin record for user_id: %s", user.ID)
			systemAdmin := &models.SystemAdmin{UserID: user.ID}
			if err := tx.Create(systemAdmin).Error; err != nil {
				log.Printf("[REPO ERROR] Failed to create system admin record: %v", err)
				return fmt.Errorf("failed to create system admin record for user_id %s: %w", user.ID, err)
			}
			log.Printf("[REPO] System admin record created with ID: %s", systemAdmin.ID)
		case models.UserTypeInstituteAdmin:
			if user.InstituteAdmin != nil {
				user.InstituteAdmin.UserID = user.ID
				log.Printf("[REPO] Creating institute admin record with InstituteID: %s for user_id: %s", user.InstituteAdmin.InstituteID, user.ID)
				if err := tx.Create(user.InstituteAdmin).Error; err != nil {
					log.Printf("[REPO ERROR] Failed to create institute admin record: %v", err)
					return fmt.Errorf("failed to create institute admin record for user_id %s: %w", user.ID, err)
				}
				log.Printf("[REPO] Institute admin record created with ID: %s", user.InstituteAdmin.ID)
			} else {
				log.Printf("[REPO WARNING] InstituteAdmin data is nil for user_type institute_admin")
			}
		}

		log.Printf("[REPO SUCCESS] Transaction completed successfully for user_id: %s, email: %s", user.ID, user.Email)
		return nil
	})
}

func (r *userRepository) GetByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Roles").First(&user, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	// Load type-specific data
	if err := r.loadUserTypeData(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	log.Printf("[REPO] Looking up user by email: %s", email)
	var user models.User
	err := r.db.Where("email = ?", email).Preload("Roles").First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[REPO] User not found with email: %s", email)
			return nil, fmt.Errorf("user not found")
		}
		log.Printf("[REPO ERROR] Database error while fetching user by email %s: %v", email, err)
		return nil, err
	}

	log.Printf("[REPO] User found with email: %s, ID: %s, password hash length: %d",
		email, user.ID, len(user.PasswordHash))

	if err := r.loadUserTypeData(&user); err != nil {
		log.Printf("[REPO ERROR] Failed to load type-specific data for user %s: %v", user.ID, err)
		return nil, err
	}

	log.Printf("[REPO SUCCESS] Successfully retrieved user %s with all data", user.ID)
	return &user, nil
}

func (r *userRepository) GetAll(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	if err := r.db.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Preload("Roles").Limit(limit).Offset(offset).Find(&users).Error
	if err != nil {
		return nil, 0, err
	}

	// Load type-specific data for each user
	for i := range users {
		if err := r.loadUserTypeData(&users[i]); err != nil {
			return nil, 0, err
		}
	}

	return users, total, nil
}

func (r *userRepository) Update(user *models.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Update base user
		if err := tx.Save(user).Error; err != nil {
			return err
		}

		// Update type-specific record
		switch user.UserType {
		case models.UserTypeStudent:
			if user.Student != nil {
				if err := tx.Save(user.Student).Error; err != nil {
					return err
				}
			}
		case models.UserTypeInstructor:
			if user.Instructor != nil {
				if err := tx.Save(user.Instructor).Error; err != nil {
					return err
				}
			}
		case models.UserTypeInstituteAdmin:
			if user.InstituteAdmin != nil {
				if err := tx.Save(user.InstituteAdmin).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (r *userRepository) UpdatePasswordHash(userID string, passwordHash string) error {
	log.Printf("[REPO] Updating password hash for user_id: %s", userID)

	// Use Model + Updates to only update the password_hash column
	result := r.db.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", passwordHash)

	if result.Error != nil {
		log.Printf("[REPO ERROR] Failed to update password hash for user_id %s: %v", userID, result.Error)
		return fmt.Errorf("failed to update password hash: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		log.Printf("[REPO ERROR] No user found with id %s to update password", userID)
		return fmt.Errorf("user not found")
	}

	log.Printf("[REPO SUCCESS] Password hash updated for user_id: %s", userID)
	return nil
}

func (r *userRepository) Delete(id string) error {
	return r.db.Delete(&models.User{}, "id = ?", id).Error
}

func (r *userRepository) AssignRoles(userID string, roleIDs []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete existing roles
		if err := tx.Where("user_id = ?", userID).Delete(&models.UserRole{}).Error; err != nil {
			return err
		}

		// Assign new roles
		for _, roleID := range roleIDs {
			userRole := models.UserRole{
				UserID: userID,
				RoleID: roleID,
			}
			if err := tx.Create(&userRole).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *userRepository) loadUserTypeData(user *models.User) error {
	switch user.UserType {
	case models.UserTypeStudent:
		var student models.Student
		if err := r.db.Where("user_id = ?", user.ID).First(&student).Error; err != nil {
			return err
		}
		user.Student = &student

		// Load current membership
		var membership models.StudentMembership
		err := r.db.Where("student_id = ? AND is_current = ?", student.ID, true).
			Preload("Faculty").
			Preload("Department").
			Preload("Class").
			First(&membership).Error
		if err == nil {
			student.CurrentMembership = &membership
		}

	case models.UserTypeInstructor:
		var instructor models.Instructor
		if err := r.db.Where("user_id = ?", user.ID).First(&instructor).Error; err != nil {
			return err
		}
		user.Instructor = &instructor

	case models.UserTypeSystemAdmin:
		var admin models.SystemAdmin
		if err := r.db.Where("user_id = ?", user.ID).First(&admin).Error; err != nil {
			return err
		}
		user.SystemAdmin = &admin

	case models.UserTypeInstituteAdmin:
		var admin models.InstituteAdmin
		if err := r.db.Where("user_id = ?", user.ID).Preload("Institute").First(&admin).Error; err != nil {
			return err
		}
		user.InstituteAdmin = &admin
	}

	return nil
}
