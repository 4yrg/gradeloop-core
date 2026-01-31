package api

import (
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, h *Handler) {
	// Everything is internal/identity per spec - apply internal auth middleware
	identity := app.Group("/internal/identity", middleware.InternalAuth())

	// Credentials
	identity.Post("/credentials/verify", h.ValidateCredentials)
	identity.Post("/credentials/update", h.UpdateCredentials)

	// Users
	identity.Post("/users", h.RegisterUser)
	identity.Get("/users/:id", h.GetUser)
	identity.Patch("/users/:id", h.UpdateUser) // Using PATCH as requested
	identity.Delete("/users/:id", h.DeleteUser)
	identity.Get("/users/:id/role", h.GetUserRole)
	identity.Get("/users", h.ListUsers) // Added for completeness/debugging

	// User Enrollments (keeping this accessible internally if needed, or maybe it belongs to Org?)
	identity.Get("/users/:user_id/enrollments", h.GetUserEnrollments)

	// Organizations (Assuming these should also be under internal/identity or similar)
	// Spec didn't explicitly list Org paths under 1 Identity Service in the summary block,
	// but clearly Identity Service owns org structure.
	// I'll keep them under /internal/identity/orgs for consistency.
	orgs := identity.Group("/orgs")

	// Institutes
	orgs.Post("/institutes", h.CreateInstitute)
	orgs.Get("/institutes", h.GetInstitutes)
	orgs.Patch("/institutes/:id", h.UpdateInstitute) // Changed PUT to PATCH for consistency
	orgs.Delete("/institutes/:id", h.DeleteInstitute)

	// Faculties
	orgs.Post("/faculties", h.CreateFaculty)
	orgs.Get("/faculties/:id", h.GetFaculty)
	orgs.Patch("/faculties/:id", h.UpdateFaculty)
	orgs.Delete("/faculties/:id", h.DeleteFaculty)

	// Departments
	orgs.Post("/departments", h.CreateDepartment)
	orgs.Get("/departments/:id", h.GetDepartment)
	orgs.Patch("/departments/:id", h.UpdateDepartment)
	orgs.Delete("/departments/:id", h.DeleteDepartment)

	// Classes
	orgs.Post("/classes", h.CreateClass)
	orgs.Get("/classes/:id", h.GetClass)
	orgs.Patch("/classes/:id", h.UpdateClass)
	orgs.Delete("/classes/:id", h.DeleteClass)

	// Memberships
	orgs.Post("/classes/:class_id/enrollments", h.EnrollStudent)
	orgs.Get("/classes/:class_id/enrollments", h.GetClassEnrollments)
	orgs.Delete("/classes/:class_id/enrollments/:student_id", h.UnenrollStudent)
}
