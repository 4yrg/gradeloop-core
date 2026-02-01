package api

import (
	"fmt"
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

func (h *AuthNHandler) RequestMagicLink(c *fiber.Ctx) error {
	var req service.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.svc.RequestMagicLink(c.Context(), req.Email); err != nil {
		// Log error but return success to avoid enumeration
		fmt.Printf("[AuthN] RequestMagicLink error for %s: %v\n", req.Email, err)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Magic link sent if account exists"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Magic link sent if account exists"})
}

func (h *AuthNHandler) ConsumeMagicLink(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	tokens, err := h.svc.ConsumeMagicLink(c.Context(), req.Token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(tokens)
}

func (h *AuthNHandler) Register(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		FullName string `json:"full_name"`
		UserType string `json:"user_type"`
		// Frontend fields
		Name string `json:"name"`
		Role string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Map fields
	if req.FullName == "" && req.Name != "" {
		req.FullName = req.Name
	}
	if req.UserType == "" && req.Role != "" {
		req.UserType = strings.ToUpper(req.Role)
	}

	svcReq := service.RegistrationRequest{
		Email:    req.Email,
		FullName: req.FullName,
		UserType: req.UserType,
	}

	if err := h.svc.RequestEmailConfirmation(c.Context(), svcReq); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Confirmation email sent"})
}

func (h *AuthNHandler) VerifyEmail(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	tokens, err := h.svc.ConsumeConfirmationToken(c.Context(), req.Token)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Return tokens to auto-login
	return c.JSON(tokens)
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
	userID := c.Locals("user_id").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	if err := h.svc.LogoutAll(c.Context(), userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

// RequestMagicLink replaces Login, but we keep generic naming
// ForgotPassword and ResetPassword removed

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

	// Magic Link Flow
	auth.Post("/login", h.RequestMagicLink)              // Initiates flow
	auth.Post("/magic-link/consume", h.ConsumeMagicLink) // Completes flow

	auth.Post("/register", h.Register)
	auth.Post("/verify-email", h.VerifyEmail) // Completes registration

	auth.Post("/refresh", h.RefreshToken)
	auth.Post("/logout", h.Logout)
	auth.Post("/logout-all", h.LogoutAll)

	auth.Get("/validate", h.ValidateToken)

	// Apply internal auth middleware to internal endpoints
	internal := app.Group("/internal/authn", middleware.InternalAuth())
	internal.Post("/issue-token", h.IssueToken)
}
