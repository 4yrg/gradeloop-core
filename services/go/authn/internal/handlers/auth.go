package handlers

import (
	"github.com/4yrg/gradeloop-core/develop/services/go/authn/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	resp, err := h.authService.Login(c.Context(), req.Email, req.Password, c.Get("User-Agent"), c.IP())
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"session_id":    resp.Session.Id,
		"refresh_token": resp.Session.RefreshToken,
		"access_token":  resp.AccessToken,
		"expires_at":    resp.Session.ExpiresAt,
	})
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{"message": "Refresh endpoint coming soon"})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{"message": "Logout endpoint coming soon"})
}
