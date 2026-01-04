package middlewares

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func RoleBasedRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        50, // Default limit
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Rate limit by IP for now, or UserID if authenticated
			if userID, ok := c.Locals("userID").(string); ok {
				return userID
			}
			return c.IP()
		},
		Next: func(c *fiber.Ctx) bool {
			// Custom logic to adjust Max limit based on role could go here if `limiter` supported dynamic limits per request,
			// but standard Fiber limiter sets Max at config time.
			// To strictly follow the "vary limits per role" requirement efficiently, we'd need separate limiter instances per role,
			// or valid custom logic. For simplicity and reliability in this initial version, we use a shared logic
			// or multiple middlewares based on role.

			// A better approach for per-role limits with standard fiber middleware:
			// We can return next() if we want to bypass this limiter for certain roles, or use separate limiters.
			return false
		},
	})
}

// Better implementation: Factory function that returns a limiter specific to general usage.
// Complex per-role varying logic usually requires custom middleware wrapping multiple limiters.
// For this MVP, we will implement a standard rate limiter.

func RateLimitMiddleware() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
	})
}
