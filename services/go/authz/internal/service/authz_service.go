package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/repository"
)

type CheckRequest struct {
	UserID     string
	Roles      []string
	TenantID   string
	Resource   string
	Action     string
	Attributes map[string]string
}

type CheckResponse struct {
	Allowed bool
	Reason  string
}

type AuthzService interface {
	CheckPermission(ctx context.Context, req CheckRequest) (CheckResponse, error)
}

type authzService struct {
	policyRepo     repository.PolicyRepository
	roleRepo       repository.RoleRepository
	permissionRepo repository.PermissionRepository
	auditRepo      repository.AuditRepository
}

func NewAuthzService(
	policyRepo repository.PolicyRepository,
	roleRepo repository.RoleRepository,
	permissionRepo repository.PermissionRepository,
	auditRepo repository.AuditRepository,
) AuthzService {
	return &authzService{
		policyRepo:     policyRepo,
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		auditRepo:      auditRepo,
	}
}

func (s *authzService) CheckPermission(ctx context.Context, req CheckRequest) (CheckResponse, error) {
	// 1. Check direct user policies (ABAC/Fine-grained)
	userPolicies, err := s.policyRepo.FindBySubject(ctx, req.UserID)
	if err == nil {
		for _, p := range userPolicies {
			if s.evaluatePolicy(p, req) {
				res := CheckResponse{Allowed: p.Effect == "ALLOW", Reason: "User policy match"}
				s.logResult(ctx, req, res)
				return res, nil
			}
		}
	}

	// 2. Check role-based policies
	for _, roleName := range req.Roles {
		// Get role permissions
		role, err := s.roleRepo.FindByName(ctx, roleName, req.TenantID)
		if err == nil && role != nil {
			for _, p := range role.Permissions {
				if p.Action == req.Action && p.ResourceType == req.Resource {
					res := CheckResponse{Allowed: true, Reason: fmt.Sprintf("Role %s match", roleName)}
					s.logResult(ctx, req, res)
					return res, nil
				}
			}
		}

		// Get specific role policies (ABAC for roles)
		rolePolicies, err := s.policyRepo.FindBySubject(ctx, roleName)
		if err == nil {
			for _, p := range rolePolicies {
				if s.evaluatePolicy(p, req) {
					res := CheckResponse{Allowed: p.Effect == "ALLOW", Reason: fmt.Sprintf("Role %s policy match", roleName)}
					s.logResult(ctx, req, res)
					return res, nil
				}
			}
		}
	}

	// Default deny
	res := CheckResponse{Allowed: false, Reason: "No matching policy found"}
	s.logResult(ctx, req, res)
	return res, nil
}

func (s *authzService) evaluatePolicy(p models.Policy, req CheckRequest) bool {
	// Check action and resource (supports wildcard *)
	if !matchString(p.Action, req.Action) || !matchString(p.Resource, req.Resource) {
		return false
	}

	// Evaluate conditions (ABAC)
	if p.Conditions != "" {
		var conditions map[string]interface{}
		if err := json.Unmarshal([]byte(p.Conditions), &conditions); err == nil {
			for key, val := range conditions {
				reqVal, exists := req.Attributes[key]
				if !exists || fmt.Sprintf("%v", val) != reqVal {
					return false
				}
			}
		}
	}

	return true
}

func (s *authzService) logResult(ctx context.Context, req CheckRequest, res CheckResponse) {
	result := "DENIED"
	if res.Allowed {
		result = "ALLOWED"
	}

	metadata, _ := json.Marshal(map[string]string{
		"reason":    res.Reason,
		"tenant_id": req.TenantID,
	})

	_ = s.auditRepo.Log(ctx, &models.AuditLog{
		UserID:        req.UserID,
		Resource:      req.Resource,
		Action:        req.Action,
		Result:        result,
		Metadata:      string(metadata),
		ServiceOrigin: "authz-service",
	})
}

func matchString(pattern, value string) bool {
	if pattern == "*" {
		return true
	}
	return strings.EqualFold(pattern, value)
}
