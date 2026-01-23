package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type PolicyRepository interface {
	Create(ctx context.Context, policy *models.Policy) error
	FindAll(ctx context.Context) ([]models.Policy, error)
	FindBySubject(ctx context.Context, subjectID string) ([]models.Policy, error)
	FindMatch(ctx context.Context, subjectID, action, resource string) (*models.Policy, error)
}

type policyRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewPolicyRepository(db *gorm.DB, redis *redis.Client) PolicyRepository {
	return &policyRepository{
		db:    db,
		redis: redis,
	}
}

func (r *policyRepository) Create(ctx context.Context, policy *models.Policy) error {
	if err := r.db.WithContext(ctx).Create(policy).Error; err != nil {
		return err
	}
	// Invalidate cache for this subject
	cacheKey := fmt.Sprintf("policies:%s", policy.SubjectID)
	r.redis.Del(ctx, cacheKey)
	return nil
}

func (r *policyRepository) FindAll(ctx context.Context) ([]models.Policy, error) {
	var policies []models.Policy
	if err := r.db.WithContext(ctx).Find(&policies).Error; err != nil {
		return nil, err
	}
	return policies, nil
}

func (r *policyRepository) FindBySubject(ctx context.Context, subjectID string) ([]models.Policy, error) {
	cacheKey := fmt.Sprintf("policies:%s", subjectID)

	// Try cache
	val, err := r.redis.Get(ctx, cacheKey).Result()
	if err == nil {
		var policies []models.Policy
		if err := json.Unmarshal([]byte(val), &policies); err == nil {
			return policies, nil
		}
	}

	// Cache miss or error
	var policies []models.Policy
	if err := r.db.WithContext(ctx).Where("subject_id = ?", subjectID).Find(&policies).Error; err != nil {
		return nil, err
	}

	// Save to cache
	if data, err := json.Marshal(policies); err == nil {
		r.redis.Set(ctx, cacheKey, data, 10*time.Minute)
	}

	return policies, nil
}

func (r *policyRepository) FindMatch(ctx context.Context, subjectID, action, resource string) (*models.Policy, error) {
	var policy models.Policy
	// Note: This matches simple RBAC/ABAC without full condition evaluation yet
	err := r.db.WithContext(ctx).
		Where("subject_id = ? AND action = ? AND resource = ?", subjectID, action, resource).
		First(&policy).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &policy, nil
}
