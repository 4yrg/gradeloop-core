package api

import (
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/service"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	svc *service.IdentityService
}

func NewHandler(svc *service.IdentityService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterUser(c *fiber.Ctx) error {
	var req service.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	user, err := h.svc.RegisterUser(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *Handler) ValidateCredentials(c *fiber.Ctx) error {
	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	user, valid, err := h.svc.ValidateCredentials(req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if !valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"valid": false})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"valid":   true,
		"user_id": user.ID,
		"role":    user.UserType,
	})
}
