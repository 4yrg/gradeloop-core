package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gradeloop/auth-service/database"
	"github.com/gradeloop/auth-service/middleware"
	"github.com/gradeloop/auth-service/models"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *fiber.Ctx) error {
	var req models.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not hash password"})
	}

	user := models.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Role:         req.Role,
	}

	if result := database.DB.Create(&user); result.Error != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "User already exists"})
	}

	// Don't return password hash
	user.PasswordHash = ""

	return c.Status(fiber.StatusCreated).JSON(user)
}

func Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	var user models.User
	if result := database.DB.Where("username = ?", req.Username).First(&user); result.Error != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token, err := middleware.GenerateToken(user.ID.String(), string(user.Role))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not generate token"})
	}

	return c.JSON(models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func Me(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var user models.User
	if result := database.DB.Where("id = ?", userID).First(&user); result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	user.PasswordHash = ""
	return c.JSON(user)
}
