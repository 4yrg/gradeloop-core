package api

import (
	"github.com/4yrg/gradeloop-core/services/go/email/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, h *Handler) {
	// Apply internal auth middleware to all internal endpoints
	api := app.Group("/internal/email", middleware.InternalAuth())

	api.Post("/send", h.SendRawEmail)
	api.Post("/send-template", h.SendTemplateEmail)
	api.Post("/templates", h.CreateTemplate)
	api.Get("/templates", h.ListTemplates)
	api.Get("/templates/:name", h.GetTemplate) // Added missing endpoint
	api.Get("/logs", h.GetLogs)
}
