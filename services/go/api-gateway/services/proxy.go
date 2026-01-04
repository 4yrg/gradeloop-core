package services

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

func ProxyService(target string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Fiber proxy middleware forwards to the target url + path
		// url := target + c.OriginalURL()
		// But c.OriginalURL() includes /api/auth/..., if target is http://auth-service:5000,
		// we might need to strip prefix if the backend doesn't expect it.
		// However, the previous Traefik config stripped /api.
		// Let's assume we maintain /api prefix stripping logic in the route definition or here.

		// Simpler: The user prompt example says: ProxyService("http://auth-service:8080")
		// and usage: api.Group("/auth").All("/*", ProxyService(...))

		// If we want to strip the prefix (e.g. /api/auth -> /auth or /), we need to handle it.
		// The Traefik config stripped `/api`. So `http://localhost/api/auth/login` -> `http://auth-service:5000/auth/login`.
		// The Service expects `/auth/login`.
		// So we only need to strip `/api`.

		path := c.OriginalURL()
		// Simple manual strip if starts with /api
		if len(path) >= 4 && path[:4] == "/api" {
			path = path[4:]
		}

		url := target + path

		log.Printf("Proxying request to: %s", url)

		if err := proxy.Do(c, url); err != nil {
			log.Printf("Proxy error: %v", err)
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Service unavailable"})
		}

		// Remove Server header to not disclose underlying technology
		c.Response().Header.Del(fiber.HeaderServer)
		return nil
	}
}
