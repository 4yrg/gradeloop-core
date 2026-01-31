package api

import "github.com/gofiber/fiber/v2"

func SetupRoutes(app *fiber.App, h *Handler) {
	api := app.Group("/api/v1")

	// Users
	users := api.Group("/users")
	users.Post("/", h.RegisterUser)
	users.Get("/", h.ListUsers) // New
	users.Get("/:id", h.GetUser)
	users.Put("/:id", h.UpdateUser)    // New
	users.Delete("/:id", h.DeleteUser) // New
	users.Get("/:user_id/enrollments", h.GetUserEnrollments)
	users.Post("/validate", h.ValidateCredentials)

	// Organizations
	// Organizations
	orgs := api.Group("/orgs")

	// Institutes
	orgs.Post("/institutes", h.CreateInstitute)
	orgs.Get("/institutes", h.GetInstitutes)
	orgs.Put("/institutes/:id", h.UpdateInstitute)
	orgs.Delete("/institutes/:id", h.DeleteInstitute)

	// Faculties
	orgs.Post("/faculties", h.CreateFaculty)
	orgs.Get("/faculties/:id", h.GetFaculty)
	orgs.Put("/faculties/:id", h.UpdateFaculty)
	orgs.Delete("/faculties/:id", h.DeleteFaculty)

	// Departments
	orgs.Post("/departments", h.CreateDepartment)
	orgs.Get("/departments/:id", h.GetDepartment)
	orgs.Put("/departments/:id", h.UpdateDepartment)
	orgs.Delete("/departments/:id", h.DeleteDepartment)

	// Classes
	orgs.Post("/classes", h.CreateClass)
	orgs.Get("/classes/:id", h.GetClass)
	orgs.Put("/classes/:id", h.UpdateClass)
	orgs.Delete("/classes/:id", h.DeleteClass)

	// Memberships
	api.Post("/classes/:class_id/enrollments", h.EnrollStudent)
	api.Get("/classes/:class_id/enrollments", h.GetClassEnrollments)
	api.Delete("/classes/:class_id/enrollments/:student_id", h.UnenrollStudent)
	api.Delete("/classes/:class_id/enrollments/:student_id", h.UnenrollStudent)

	// Internal
	internal := app.Group("/internal")
	internal.Post("/users", h.RegisterUser)
}
