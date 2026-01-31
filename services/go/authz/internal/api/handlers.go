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

func (h *AuthZHandler) RegisterRoutes(app *fiber.App) {
	internal := app.Group("/internal/authz", middleware.InternalAuth())

	internal.Post("/check", h.CheckPermission)
	internal.Post("/resolve", h.ResolvePermissions)
	internal.Post("/roles", h.CreateRole)
	internal.Get("/roles", h.GetRoles)
	internal.Post("/permissions", h.CreatePermission)
	internal.Get("/permissions", h.GetPermissions)
	internal.Post("/permissions/assign", h.AssignPermission)
}
