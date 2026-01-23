package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gradeloop/session-service/internal/handlers"
)

func SetupRoutes(app *fiber.App, h *handlers.ValidationHandler) {
	// Middleware
	app.Use(logger.New())
	app.Use(recover.New())

	// Health Check
	app.Get("/health", h.Health)

	// Session Management
	api := app.Group("/api/v1/session")

	api.Post("/", h.CreateSession)
	api.Post("/validate", h.ValidateSession)
	api.Post("/refresh", h.RefreshSession)
	api.Delete("/:sessionId", h.RevokeSession)
	api.Delete("/user/:userId", h.RevokeUserSessions)
}
