package api

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(app *fiber.App, handler *Handler) {
	internal := app.Group("/internal")

	sessions := internal.Group("/sessions")
	sessions.Post("/", handler.CreateSession)
	sessions.Post("/validate", handler.ValidateSession)
	sessions.Post("/refresh", handler.RefreshSession)
	sessions.Post("/:id/revoke", handler.RevokeSession)
	sessions.Get("/:id", handler.GetSession)

	users := internal.Group("/users")
	users.Post("/:userId/sessions/revoke", handler.RevokeUserSessions)
}
