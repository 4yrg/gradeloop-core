package repository

import (
	"context"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PermissionRepository
type PermissionRepository interface {
	Create(ctx context.Context, permission *models.Permission) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Permission, error)
	FindMatch(ctx context.Context, action, resourceType string) (*models.Permission, error)
	FindAll(ctx context.Context) ([]models.Permission, error)
}

type permissionRepository struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) PermissionRepository {
	return &permissionRepository{db: db}
}

func (r *permissionRepository) Create(ctx context.Context, p *models.Permission) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *permissionRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Permission, error) {
	var p models.Permission
	if err := r.db.WithContext(ctx).First(&p, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *permissionRepository) FindMatch(ctx context.Context, action, resourceType string) (*models.Permission, error) {
	var p models.Permission
	err := r.db.WithContext(ctx).Where("action = ? AND resource_type = ?", action, resourceType).First(&p).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *permissionRepository) FindAll(ctx context.Context) ([]models.Permission, error) {
	var permissions []models.Permission
	if err := r.db.WithContext(ctx).Find(&permissions).Error; err != nil {
		return nil, err
	}
	return permissions, nil
}

// AuditRepository
type AuditRepository interface {
	Log(ctx context.Context, log *models.AuditLog) error
	FindAll(ctx context.Context) ([]models.AuditLog, error)
	FindByUser(ctx context.Context, userID string) ([]models.AuditLog, error)
}

type auditRepository struct {
	db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) AuditRepository {
	return &auditRepository{db: db}
}

func (r *auditRepository) Log(ctx context.Context, log *models.AuditLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *auditRepository) FindAll(ctx context.Context) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	if err := r.db.WithContext(ctx).Order("timestamp desc").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *auditRepository) FindByUser(ctx context.Context, userID string) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("timestamp desc").Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}
