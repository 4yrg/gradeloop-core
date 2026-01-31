package api

import "github.com/gofiber/fiber/v2"

func SetupRoutes(app *fiber.App, h *Handler) {
	api := app.Group("/internal/email")

	api.Post("/send", h.SendEmail)
	api.Get("/templates", h.ListTemplates)
}
