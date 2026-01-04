package middlewares

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gradeloop/api-gateway/config"
	"github.com/gradeloop/api-gateway/utils"
)

func JWTMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid Authorization header format"})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.VerifyJWT(tokenString, cfg.JWTSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: " + err.Error()})
		}

		c.Locals("userRole", claims.Role)
		c.Locals("userID", claims.UserID)
		return c.Next()
	}
}
