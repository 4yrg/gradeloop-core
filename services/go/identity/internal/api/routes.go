package api

import "github.com/gofiber/fiber/v2"

func SetupRoutes(app *fiber.App, h *Handler) {
	api := app.Group("/api/v1")

	// Users
	users := api.Group("/users")
	users.Post("/", h.RegisterUser)
	users.Post("/validate", h.ValidateCredentials)
}
