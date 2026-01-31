package api

import (
	"github.com/4yrg/gradeloop-core/services/go/authn/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AuthNHandler struct {
	svc *service.AuthNService
}

func NewAuthNHandler(svc *service.AuthNService) *AuthNHandler {
	return &AuthNHandler{svc: svc}
}

func (h *AuthNHandler) Login(c *fiber.Ctx) error {
	var req service.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	tokens, err := h.svc.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authentication failed"})
	}

	return c.JSON(tokens)
}

func (h *AuthNHandler) Register(c *fiber.Ctx) error {
	var req service.RegistrationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.Register(c.Context(), req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *AuthNHandler) RegisterRoutes(app *fiber.App) {
	auth := app.Group("/auth")

	auth.Post("/login", h.Login)
	auth.Post("/register", h.Register)
	// Add other routes as implemented
}
