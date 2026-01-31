package api

import (
	"strings"

	"github.com/4yrg/gradeloop-core/services/go/authn/internal/middleware"
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
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
		UserType string `json:"user_type"`
		// Frontend fields
		Name string `json:"name"`
		Role string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Map fields if names from frontend are used
	if req.FullName == "" && req.Name != "" {
		req.FullName = req.Name
	}
	if req.UserType == "" && req.Role != "" {
		req.UserType = strings.ToUpper(req.Role)
	}

	svcReq := service.RegistrationRequest{
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		UserType: req.UserType,
	}

	if err := h.svc.Register(c.Context(), svcReq); err != nil {
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

func (h *AuthNHandler) LogoutAll(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string) // Assuming Auth middleware sets this
	// If no middleware, maybe passed in body? But safer from token.
	// Spec says "POST /auth/logout-all".

	if userID == "" {
		// Fallback to body if testing without full auth middleware setup?
		// For safety, let's assume we need to extract from token or it's passed.
		// Detailed impl would parse token here if middleware didn't.
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	if err := h.svc.LogoutAll(c.Context(), userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthNHandler) ForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.ForgotPassword(c.Context(), req.Email); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthNHandler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.ResetPassword(c.Context(), req.Token, req.NewPassword); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthNHandler) IssueToken(c *fiber.Ctx) error {
	var req struct {
		UserID      string   `json:"user_id"`
		Role        string   `json:"role"`
		Permissions []string `json:"permissions"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	token, err := h.svc.IssueToken(c.Context(), req.UserID, req.Role, req.Permissions)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(token)
}

func (h *AuthNHandler) RegisterRoutes(app *fiber.App) {
	auth := app.Group("/auth")

	auth.Post("/login", h.Login)
	auth.Post("/register", h.Register)
	auth.Post("/refresh", h.RefreshToken)
	auth.Post("/logout", h.Logout)
	auth.Post("/logout-all", h.LogoutAll) // Middleware needed here in real app
	auth.Post("/forgot-password", h.ForgotPassword)
	auth.Post("/reset-password", h.ResetPassword)
	auth.Get("/validate", h.ValidateToken)

	// Apply internal auth middleware to internal endpoints
	internal := app.Group("/internal/authn", middleware.InternalAuth())
	internal.Post("/issue-token", h.IssueToken)
}
