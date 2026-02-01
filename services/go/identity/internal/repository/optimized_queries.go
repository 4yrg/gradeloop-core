package repository

import (
	"errors"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"gorm.io/gorm"
)

// Add these optimized methods to your repository for specific use cases

// GetUserByEmailLean - Get user without any profiles for authentication checks
func (r *Repository) GetUserByEmailLean(email string) (*core.User, error) {
	var user core.User
	err := r.db.Select("id, email, user_type, status, email_verified, is_active, created_at, updated_at").
		Where("email = ? AND deleted_at IS NULL", email).
		First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	return &user, err
}

// GetUsersByTypeWithProfiles - Efficiently get users by type with their profiles
func (r *Repository) GetUsersByTypeWithProfiles(userType core.UserType, offset, limit int) ([]core.User, error) {
	var users []core.User
	query := r.db.Model(&core.User{}).Where("user_type = ?", userType)
	
	switch userType {
	case core.UserTypeStudent:
		query = query.Preload("StudentProfile")
	case core.UserTypeInstructor:
		query = query.Preload("InstructorProfile")  
	case core.UserTypeInstituteAdmin:
		query = query.Preload("InstituteAdminProfile")
	}
	
	err := query.Offset(offset).Limit(limit).Find(&users).Error
	return users, err
}

// CountUsersByType - Fast count query without loading data
func (r *Repository) CountUsersByType(userType core.UserType) (int64, error) {
	var count int64
	err := r.db.Model(&core.User{}).
		Where("user_type = ? AND deleted_at IS NULL", userType).
		Count(&count).Error
	return count, err
}