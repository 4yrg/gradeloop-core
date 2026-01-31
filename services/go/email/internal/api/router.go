package api

import "github.com/gofiber/fiber/v2"

func SetupRoutes(app *fiber.App, h *Handler) {
	api := app.Group("/internal/email")

	api.Post("/send", h.SendRawEmail)
	api.Post("/send-template", h.SendTemplateEmail)
	api.Post("/templates", h.CreateTemplate)
	api.Get("/templates", h.ListTemplates)
	api.Get("/logs", h.GetLogs)
}
