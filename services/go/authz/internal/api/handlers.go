package api

import (
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/core/domain"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/middleware"
	"github.com/4yrg/gradeloop-core/services/go/authz/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AuthZHandler struct {
	svc *service.AuthZService
}

func NewAuthZHandler(svc *service.AuthZService) *AuthZHandler {
	return &AuthZHandler{svc: svc}
}

type CheckRequest struct {
	Subject  string `json:"subject"`
	Role     string `json:"role"`
	Resource string `json:"resource"`
	Action   string `json:"action"`
}

type CheckResponse struct {
	Allowed bool `json:"allowed"`
}

func (h *AuthZHandler) CheckPermission(c *fiber.Ctx) error {
	var req CheckRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	allowed, err := h.svc.CheckPermission(req.Subject, req.Role, req.Resource, req.Action)
	if err != nil {
		// Log error but return false for security
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(CheckResponse{Allowed: allowed})
}

func (h *AuthZHandler) CreateRole(c *fiber.Ctx) error {
	var req struct {
		Name        string       `json:"name"`
		Scope       domain.Scope `json:"scope"`
		Description string       `json:"description"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.CreateRole(req.Name, req.Scope, req.Description); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *AuthZHandler) GetRoles(c *fiber.Ctx) error {
	roles, err := h.svc.GetAllRoles()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(roles)
}

func (h *AuthZHandler) CreatePermission(c *fiber.Ctx) error {
	var req struct {
		Name        string `json:"name"`
		Resource    string `json:"resource"`
		Action      string `json:"action"`
		Description string `json:"description"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.CreatePermission(req.Name, req.Resource, req.Action, req.Description); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *AuthZHandler) GetPermissions(c *fiber.Ctx) error {
	perms, err := h.svc.GetAllPermissions()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(perms)
}

func (h *AuthZHandler) AssignPermission(c *fiber.Ctx) error {
	var req struct {
		RoleName string `json:"role_name"`
		PermName string `json:"perm_name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.AssignPermission(req.RoleName, req.PermName); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthZHandler) ResolvePermissions(c *fiber.Ctx) error {
	var req struct {
		UserID string `json:"user_id"`
		Role   string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	perms, err := h.svc.ResolvePermissions(req.UserID, req.Role)
	if err != nil {
		// If role not found, maybe return valid empty permissions?
		// For now return error to be safe
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"permissions": perms})
}

func (h *AuthZHandler) UpdateRole(c *fiber.Ctx) error {
	name := c.Params("name") // Using name as ID
	var req struct {
		Description string `json:"description"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	if err := h.svc.UpdateRole(name, req.Description); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthZHandler) CreatePolicy(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNotImplemented)
}

func (h *AuthZHandler) GetPolicies(c *fiber.Ctx) error {
	return c.JSON([]string{})
}

func (h *AuthZHandler) DeletePolicy(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthZHandler) ServiceToken(c *fiber.Ctx) error {
	var req struct {
		ServiceName string `json:"service_name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}
	token, err := h.svc.IssueServiceToken(req.ServiceName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"token": token})

}

func (h *AuthZHandler) RegisterRoutes(app *fiber.App) {
	internal := app.Group("/internal/authz", middleware.InternalAuth())

	internal.Post("/check", h.CheckPermission)
	internal.Post("/resolve", h.ResolvePermissions)

	internal.Post("/roles", h.CreateRole)
	internal.Get("/roles", h.GetRoles)
	internal.Patch("/roles/:name", h.UpdateRole)
	internal.Delete("/roles/:name", h.DeleteRole)

	internal.Post("/permissions", h.CreatePermission)
	internal.Get("/permissions", h.GetPermissions)
	internal.Delete("/permissions/:name", h.DeletePermission)
	internal.Post("/permissions/assign", h.AssignPermission)
	internal.Post("/permissions/revoke", h.RevokePermission)

	internal.Post("/policies", h.CreatePolicy)
	internal.Get("/policies", h.GetPolicies)
	internal.Delete("/policies/:id", h.DeletePolicy)

	internal.Post("/service-token", h.ServiceToken)
}

func (h *AuthZHandler) DeleteRole(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Role name required"})
	}

	if err := h.svc.DeleteRole(name); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthZHandler) DeletePermission(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Permission name required"})
	}

	if err := h.svc.DeletePermission(name); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthZHandler) RevokePermission(c *fiber.Ctx) error {
	var req struct {
		RoleName string `json:"role_name"`
		PermName string `json:"perm_name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.RevokePermission(req.RoleName, req.PermName); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}
