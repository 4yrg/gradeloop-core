package repository

import (
	"errors"
	"fmt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.User) error
	GetByID(id uint) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetAll(limit, offset int) ([]models.User, int64, error)
	Update(user *models.User) error
	Delete(id uint) error
	AssignRoles(userID uint, roleIDs []uint) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Create the base user
		if err := tx.Create(user).Error; err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}

		// Before creating type-specific records, check if one already exists (from a failed previous transaction)
		// and clean it up if found
		switch user.UserType {
		case models.UserTypeStudent:
			// Check for orphaned student record
			var existingStudent models.Student
			if err := tx.Where("user_id = ?", user.ID).First(&existingStudent).Error; err == nil {
				// Orphaned student record exists, delete it
				if err := tx.Delete(&existingStudent).Error; err != nil {
					return fmt.Errorf("failed to clean up orphaned student record for user_id %d: %w", user.ID, err)
				}
			}
		case models.UserTypeInstructor:
			// Check for orphaned instructor record
			var existingInstructor models.Instructor
			if err := tx.Where("user_id = ?", user.ID).First(&existingInstructor).Error; err == nil {
				// Orphaned instructor record exists, delete it
				if err := tx.Delete(&existingInstructor).Error; err != nil {
					return fmt.Errorf("failed to clean up orphaned instructor record for user_id %d: %w", user.ID, err)
				}
			}
		case models.UserTypeSystemAdmin:
			// Check for orphaned system admin record
			var existingSysAdmin models.SystemAdmin
			if err := tx.Where("user_id = ?", user.ID).First(&existingSysAdmin).Error; err == nil {
				// Orphaned system admin record exists, delete it
				if err := tx.Delete(&existingSysAdmin).Error; err != nil {
					return fmt.Errorf("failed to clean up orphaned system admin record for user_id %d: %w", user.ID, err)
				}
			}
		case models.UserTypeInstituteAdmin:
			// Check for orphaned institute admin record
			var existingInstAdmin models.InstituteAdmin
			if err := tx.Where("user_id = ?", user.ID).First(&existingInstAdmin).Error; err == nil {
				// Orphaned institute admin record exists, delete it
				if err := tx.Delete(&existingInstAdmin).Error; err != nil {
					return fmt.Errorf("failed to clean up orphaned institute admin record for user_id %d: %w", user.ID, err)
				}
			}
		}

		// Create type-specific record
		switch user.UserType {
		case models.UserTypeStudent:
			if user.Student != nil {
				user.Student.UserID = user.ID
				user.Student.ID = 0 // Reset ID to let GORM auto-generate it
				if err := tx.Create(user.Student).Error; err != nil {
					return fmt.Errorf("failed to create student record for user_id %d: %w", user.ID, err)
				}
			}
		case models.UserTypeInstructor:
			if user.Instructor != nil {
				user.Instructor.UserID = user.ID
				user.Instructor.ID = 0 // Reset ID to let GORM auto-generate it
				if err := tx.Create(user.Instructor).Error; err != nil {
					return fmt.Errorf("failed to create instructor record for user_id %d: %w", user.ID, err)
				}
			}
		case models.UserTypeSystemAdmin:
			systemAdmin := &models.SystemAdmin{UserID: user.ID}
			if err := tx.Create(systemAdmin).Error; err != nil {
				return fmt.Errorf("failed to create system admin record for user_id %d: %w", user.ID, err)
			}
		case models.UserTypeInstituteAdmin:
			if user.InstituteAdmin != nil {
				user.InstituteAdmin.UserID = user.ID
				user.InstituteAdmin.ID = 0 // Reset ID to let GORM auto-generate it
				if err := tx.Create(user.InstituteAdmin).Error; err != nil {
					return fmt.Errorf("failed to create institute admin record for user_id %d: %w", user.ID, err)
				}
			}
		}

		return nil
	})
}

func (r *userRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Roles").First(&user, id).Error
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
	var user models.User
	err := r.db.Where("email = ?", email).Preload("Roles").First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	if err := r.loadUserTypeData(&user); err != nil {
		return nil, err
	}

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

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *userRepository) AssignRoles(userID uint, roleIDs []uint) error {
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
