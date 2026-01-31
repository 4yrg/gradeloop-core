package service

import (
	"time"

	"github.com/4yrg/gradeloop-core/services/go/authz/internal/core/domain"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/repository"
)

type AuthZService struct {
	repo *repository.AuthZRepository
}

func NewAuthZService(repo *repository.AuthZRepository) *AuthZService {
	return &AuthZService{repo: repo}
}

func (s *AuthZService) Init() error {
	return s.repo.AutoMigrate()
}

func (s *AuthZService) CheckPermission(subject string, role string, resource string, action string) (bool, error) {
	allowed, err := s.repo.CheckPermission(role, resource, action)

	decision := "DENY"
	if allowed {
		decision = "ALLOW"
	}

	// Async audit logging
	go func() {
		_ = s.repo.LogAudit(&domain.AuditLog{
			Subject:   subject,
			Resource:  resource,
			Action:    action,
			Decision:  decision,
			Timestamp: time.Now(),
		})
	}()

	return allowed, err
}

func (s *AuthZService) CreateRole(name string, scope domain.Scope, description string) error {
	role := &domain.Role{
		Name:        name,
		Scope:       scope,
		Description: description,
	}
	return s.repo.CreateRole(role)
}

func (s *AuthZService) GetAllRoles() ([]domain.Role, error) {
	return s.repo.GetAllRoles()
}

func (s *AuthZService) CreatePermission(name, resource, action, description string) error {
	perm := &domain.Permission{
		Name:        name,
		Resource:    resource,
		Action:      action,
		Description: description,
	}
	return s.repo.CreatePermission(perm)
}

func (s *AuthZService) GetAllPermissions() ([]domain.Permission, error) {
	return s.repo.GetAllPermissions()
}

func (s *AuthZService) AssignPermission(roleName, permName string) error {
	return s.repo.AssignPermissionToRole(roleName, permName)
}

func (s *AuthZService) SeedDefaults() error {
	// Seed System Admin
	_ = s.CreateRole("system_admin", domain.ScopeSystem, "Super Administrator")

	// Seed Institute Admin
	_ = s.CreateRole("institute_admin", domain.ScopeInstitute, "Institute Administrator")

	// Create some base permissions
	_ = s.CreatePermission("user.create", "user", "create", "Can create users")
	_ = s.CreatePermission("user.read", "user", "read", "Can read users")
	_ = s.CreatePermission("user.update", "user", "update", "Can update users")
	_ = s.CreatePermission("user.delete", "user", "delete", "Can delete users")

	// Assign permissions to System Admin
	_ = s.AssignPermission("system_admin", "user.create")
	_ = s.AssignPermission("system_admin", "user.read")
	_ = s.AssignPermission("system_admin", "user.update")
	_ = s.AssignPermission("system_admin", "user.delete")

	return nil
}
