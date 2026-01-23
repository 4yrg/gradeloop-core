package repository

import (
	"context"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoleRepository interface {
	Create(ctx context.Context, role *models.Role) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Role, error)
	FindByName(ctx context.Context, name string, tenantID string) (*models.Role, error)
	FindAll(ctx context.Context, tenantID string) ([]models.Role, error)
	AssignPermission(ctx context.Context, roleID uuid.UUID, permissionID uuid.UUID) error
}

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) Create(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).Create(role).Error
}

func (r *roleRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	var role models.Role
	if err := r.db.WithContext(ctx).Preload("Permissions").First(&role, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *roleRepository) FindByName(ctx context.Context, name string, tenantID string) (*models.Role, error) {
	var role models.Role
	query := r.db.WithContext(ctx).Preload("Permissions").Where("name = ?", name)
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	if err := query.First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *roleRepository) FindAll(ctx context.Context, tenantID string) ([]models.Role, error) {
	var roles []models.Role
	query := r.db.WithContext(ctx).Preload("Permissions")
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	if err := query.Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *roleRepository) AssignPermission(ctx context.Context, roleID uuid.UUID, permissionID uuid.UUID) error {
	var role models.Role
	var permission models.Permission

	if err := r.db.First(&role, "id = ?", roleID).Error; err != nil {
		return err
	}
	if err := r.db.First(&permission, "id = ?", permissionID).Error; err != nil {
		return err
	}

	return r.db.Model(&role).Association("Permissions").Append(&permission)
}
