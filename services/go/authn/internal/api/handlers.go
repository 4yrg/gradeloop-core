package api

import (
	"strings"

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

func (h *AuthNHandler) RefreshToken(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	tokens, err := h.svc.RefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid refresh token"})
	}

	return c.JSON(tokens)
}

func (h *AuthNHandler) Logout(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.SendStatus(fiber.StatusOK) // Idempotent
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	if err := h.svc.Logout(c.Context(), token); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthNHandler) ValidateToken(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.svc.ValidateToken(c.Context(), token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	return c.JSON(claims)
}

func (h *AuthNHandler) RegisterRoutes(app *fiber.App) {
	auth := app.Group("/auth")

	auth.Post("/login", h.Login)
	auth.Post("/register", h.Register)
	auth.Post("/refresh", h.RefreshToken)
	auth.Post("/logout", h.Logout)
	auth.Get("/validate", h.ValidateToken)
}
