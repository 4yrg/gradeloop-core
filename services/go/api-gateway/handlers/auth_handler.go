package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gradeloop/api-gateway/services"
)

func Login(c *fiber.Ctx) error {
	type Request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	log.Printf("Gateway: Login request received for %s", req.Email)

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	resp, err := services.LoginGrpc(req.Email, req.Password)
	if err != nil {
		log.Printf("Gateway: Login error for %s: %v", req.Email, err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	log.Printf("Gateway: Login successful for %s", req.Email)

	return c.JSON(fiber.Map{
		"token": resp.Token,
		"user": fiber.Map{
			"id":    resp.UserId,
			"email": resp.Email,
			"name":  resp.Name,
			"role":  resp.Role,
		},
	})
}

func Register(c *fiber.Ctx) error {
	type Request struct {
		Email    string `json:"email"`
		Name     string `json:"name"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	log.Printf("Gateway: Register request received for %s", req.Email)

	if req.Email == "" || req.Name == "" || req.Password == "" || req.Role == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "All fields are required"})
	}

	resp, err := services.RegisterGrpc(req.Email, req.Name, req.Password, req.Role)
	if err != nil {
		log.Printf("Gateway: Register error for %s: %v", req.Email, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Printf("Gateway: Register successful for %s", req.Email)

	return c.JSON(fiber.Map{
		"token": resp.Token,
		"user": fiber.Map{
			"id":    resp.Id,
			"email": resp.Email,
			"name":  resp.Name,
			"role":  resp.Role,
		},
	})
}

func GetMe(c *fiber.Ctx) error {
	// Usually /me is handled by auth service.
	// We can either proxy it or call gRPC.
	// Since we use RBAC in the gateway, we already have the user info in the token.
	// But let's check the token with auth service.
	token := c.Get("Authorization")
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	resp, err := services.ValidateTokenGrpc(token)
	if err != nil || !resp.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":   resp.UserId,
			"role": resp.Role,
		},
	})
}

func ForgotPassword(c *fiber.Ctx) error {
	type Request struct {
		Email string `json:"email"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	resp, err := services.ForgotPasswordGrpc(req.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": resp.Message,
	})
}

func ResetPassword(c *fiber.Ctx) error {
	type Request struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	resp, err := services.ResetPasswordGrpc(req.Token, req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": resp.Message,
	})
}
