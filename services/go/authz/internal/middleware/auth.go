package middleware

import (
	"crypto/subtle"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
)

func InternalAuth() fiber.Handler {
	secret := os.Getenv("INTERNAL_SECRET")
	if secret == "" {
		log.Warn("INTERNAL_SECRET is not set, defaulting to 'insecure-secret-for-dev'")
		secret = "insecure-secret-for-dev"
	}

	return func(c *fiber.Ctx) error {
		token := c.Get("X-Internal-Token")
		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing internal token"})
		}

		if subtle.ConstantTimeCompare([]byte(token), []byte(secret)) != 1 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid internal token"})
		}

		return c.Next()
	}
}
