package repository

import (
	"errors"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound = errors.New("user not found")
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// AutoMigrate applies schema changes
func (r *Repository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&core.User{},
		&core.StudentProfile{},
		&core.InstructorProfile{},
		&core.InstituteAdminProfile{},
		&core.Institute{},
		&core.Faculty{},
		&core.Department{},
		&core.Class{},
		&core.ClassEnrollment{},
	)
}

// -- User Management --

func (r *Repository) CreateUser(user *core.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// GORM handles association creation if the struct fields are populated
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *Repository) GetUserByEmail(email string) (*core.User, error) {
	var user core.User
	// Eager load all potential profiles
	err := r.db.Preload("StudentProfile").
		Preload("InstructorProfile").
		Preload("InstituteAdminProfile").
		Where("email = ?", email).
		First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByID(id string) (*core.User, error) {
	var user core.User
	err := r.db.Preload("StudentProfile").
		Preload("InstructorProfile").
		Preload("InstituteAdminProfile").
		Where("id = ?", id).
		First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}
