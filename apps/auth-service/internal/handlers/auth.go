package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gradeloop/auth-service/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	type LoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	user, token, err := h.svc.Login(req.Email, req.Password)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user":  user,
	})
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	return c.SendString("Register not implemented yet")
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	return c.SendString("Me not implemented yet")
}
