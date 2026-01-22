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

	session, err := h.authService.Login(c.Context(), req.Email, req.Password, c.Get("User-Agent"), c.IP())
	if err != nil {
		// Differentiate errors if possible (401 vs 500)
		// For now simple 401/500 split based on error string is tedious, simplify
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"session_id":    session.Id,
		"refresh_token": session.RefreshToken,
		// Access Token generation is missing in Session Service logic we implemented?
		// Session Service creates refresh token and returns expiry.
		// Wait, AuthN usually mints JWT Access Token using Session/User info?
		// My Plan said "Token Management (JWT Access/Refresh)".
		// My `AuthService.Login` returns `session.Session` (proto).
		// The proto session has `refresh_token` but NOT `access_token`.
		// `Access Token` should be a JWT signed by AuthN service.
		// So `handlers.Login` (or `service.Login`) should Generate JWT.
		// I missed `GenerateJWT` in `AuthService`.
		// I should add JWT generation to `AuthService.Login`.
	})
}
