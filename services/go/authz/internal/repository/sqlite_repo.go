package repository

import (
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/core/domain"
	"gorm.io/gorm"
)

type AuthZRepository struct {
	db *gorm.DB
}

func NewAuthZRepository(db *gorm.DB) *AuthZRepository {
	return &AuthZRepository{db: db}
}

// AutoMigrate applies schema changes
func (r *AuthZRepository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&domain.Role{},
		&domain.Permission{},
		&domain.Policy{},
		&domain.AuditLog{},
	)
}

// CheckPermission checks if a role has a specific permission
func (r *AuthZRepository) CheckPermission(roleName string, resource string, action string) (bool, error) {
	var count int64
	err := r.db.Table("roles").
		Joins("JOIN role_permissions ON role_permissions.role_id = roles.id").
		Joins("JOIN permissions ON permissions.id = role_permissions.permission_id").
		Where("roles.name = ?", roleName).
		Where("permissions.resource = ?", resource).
		Where("permissions.action = ?", action).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// CreateRole creates a new role
func (r *AuthZRepository) CreateRole(role *domain.Role) error {
	return r.db.Create(role).Error
}

// GetRoleByName fetches a role by name
func (r *AuthZRepository) GetRoleByName(name string) (*domain.Role, error) {
	var role domain.Role
	err := r.db.Preload("Permissions").Where("name = ?", name).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// GetAllRoles returns all roles
func (r *AuthZRepository) GetAllRoles() ([]domain.Role, error) {
	var roles []domain.Role
	err := r.db.Preload("Permissions").Find(&roles).Error
	return roles, err
}

// CreatePermission creates a new permission
func (r *AuthZRepository) CreatePermission(perm *domain.Permission) error {
	return r.db.Create(perm).Error
}

// GetAllPermissions returns all permissions
func (r *AuthZRepository) GetAllPermissions() ([]domain.Permission, error) {
	var perms []domain.Permission
	err := r.db.Find(&perms).Error
	return perms, err
}

// AssignPermissionToRole maps a permission to a role
func (r *AuthZRepository) AssignPermissionToRole(roleName string, permName string) error {
	role, err := r.GetRoleByName(roleName)
	if err != nil {
		return err
	}

	var perm domain.Permission
	if err := r.db.Where("name = ?", permName).First(&perm).Error; err != nil {
		return err
	}

	return r.db.Model(role).Association("Permissions").Append(&perm)
}

// RevokePermissionFromRole removes a permission from a role
func (r *AuthZRepository) RevokePermissionFromRole(roleName string, permName string) error {
	role, err := r.GetRoleByName(roleName)
	if err != nil {
		return err
	}

	var perm domain.Permission
	if err := r.db.Where("name = ?", permName).First(&perm).Error; err != nil {
		return err
	}

	return r.db.Model(role).Association("Permissions").Delete(&perm)
}

// DeleteRole deletes a role
func (r *AuthZRepository) DeleteRole(name string) error {
	return r.db.Where("name = ?", name).Delete(&domain.Role{}).Error
}

// DeletePermission deletes a permission
func (r *AuthZRepository) DeletePermission(name string) error {
	return r.db.Where("name = ?", name).Delete(&domain.Permission{}).Error
}

// UpdateRole updates a role's description
func (r *AuthZRepository) UpdateRole(name string, description string) error {
	return r.db.Model(&domain.Role{}).Where("name = ?", name).Update("description", description).Error
}

// LogAudit saves an audit log entry
func (r *AuthZRepository) LogAudit(log *domain.AuditLog) error {
	return r.db.Create(log).Error
}
