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

func (s *AuthZService) ResolvePermissions(userID string, roleName string) ([]string, error) {
	// 1. Get Role and its permissions
	role, err := s.repo.GetRoleByName(roleName)
	if err != nil {
		return nil, err // Return empty if role not found or error
	}

	// 2. Extract Permission Names
	var permissions []string
	for _, p := range role.Permissions {
		permissions = append(permissions, p.Name)
	}

	// 3. (Optional) Evaluate Policies if any (Future scope)

	return permissions, nil
}

func (s *AuthZService) DeleteRole(name string) error {
	return s.repo.DeleteRole(name)
}

func (s *AuthZService) DeletePermission(name string) error {
	return s.repo.DeletePermission(name)
}

func (s *AuthZService) RevokePermission(roleName, permName string) error {
	return s.repo.RevokePermissionFromRole(roleName, permName)
}

func (s *AuthZService) UpdateRole(name string, description string) error {
	// TODO: Implement update logic in repo
	return nil
}

// Policy Management
// Note: In this system, policies are implicit through role-permission assignments.
// The Policy table is designed for future ABAC (Attribute-Based Access Control) with conditions.
// For now, we return role-permission mappings as "policies".
func (s *AuthZService) CreatePolicy(roleName, permissionName string) error {
	// Creating a "policy" is essentially assigning a permission to a role
	return s.AssignPermission(roleName, permissionName)
}

func (s *AuthZService) GetPolicies() ([]map[string]interface{}, error) {
	// Return all role-permission assignments as policies
	roles, err := s.repo.GetAllRoles()
	if err != nil {
		return nil, err
	}

	var policies []map[string]interface{}
	for _, role := range roles {
		for _, perm := range role.Permissions {
			policies = append(policies, map[string]interface{}{
				"id":         role.ID.String() + ":" + perm.ID.String(),
				"role":       role.Name,
				"permission": perm.Name,
				"resource":   perm.Resource,
				"action":     perm.Action,
			})
		}
	}
	return policies, nil
}

func (s *AuthZService) DeletePolicy(id string) error {
	// For now, this is a no-op since we don't have direct policy deletion
	// In a full ABAC implementation, this would delete a Policy record
	return nil
}

func (s *AuthZService) IssueServiceToken(serviceName string) (string, error) {
	// Generate a long-lived JWT for the service
	// Mock for now
	return "mock_service_token_" + serviceName, nil
}
