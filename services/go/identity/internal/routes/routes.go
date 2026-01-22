package routes

import (
	"net/http"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Router struct {
	userHandler       *handlers.UserHandler
	instituteHandler  *handlers.InstituteHandler
	facultyHandler    *handlers.FacultyHandler
	departmentHandler *handlers.DepartmentHandler
	classHandler      *handlers.ClassHandler
	membershipHandler *handlers.MembershipHandler
	roleHandler       *handlers.RoleHandler
}

func NewRouter(
	userHandler *handlers.UserHandler,
	instituteHandler *handlers.InstituteHandler,
	facultyHandler *handlers.FacultyHandler,
	departmentHandler *handlers.DepartmentHandler,
	classHandler *handlers.ClassHandler,
	membershipHandler *handlers.MembershipHandler,
	roleHandler *handlers.RoleHandler,
) *Router {
	return &Router{
		userHandler:       userHandler,
		instituteHandler:  instituteHandler,
		facultyHandler:    facultyHandler,
		departmentHandler: departmentHandler,
		classHandler:      classHandler,
		membershipHandler: membershipHandler,
		roleHandler:       roleHandler,
	}
}

func (rt *Router) Setup() *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// User routes
		r.Route("/users", func(r chi.Router) {
			r.Post("/", rt.userHandler.CreateUser)
			r.Get("/", rt.userHandler.GetAllUsers)
			r.Get("/{id}", rt.userHandler.GetUser)
			r.Put("/{id}", rt.userHandler.UpdateUser)
			r.Delete("/{id}", rt.userHandler.DeleteUser)
			r.Post("/{id}/roles", rt.userHandler.AssignRoles)
		})

		// Institute routes
		r.Route("/institutes", func(r chi.Router) {
			r.Post("/", rt.instituteHandler.CreateInstitute)
			r.Get("/", rt.instituteHandler.GetAllInstitutes)
			r.Get("/{id}", rt.instituteHandler.GetInstitute)
			r.Put("/{id}", rt.instituteHandler.UpdateInstitute)
			r.Delete("/{id}", rt.instituteHandler.DeleteInstitute)
		})

		// Faculty routes
		r.Route("/faculties", func(r chi.Router) {
			r.Post("/", rt.facultyHandler.CreateFaculty)
			r.Get("/{id}", rt.facultyHandler.GetFaculty)
			r.Put("/{id}", rt.facultyHandler.UpdateFaculty)
			r.Delete("/{id}", rt.facultyHandler.DeleteFaculty)
		})

		// Get faculties by institute
		r.Get("/institutes/{instituteId}/faculties", rt.facultyHandler.GetFacultiesByInstitute)

		// Department routes
		r.Route("/departments", func(r chi.Router) {
			r.Post("/", rt.departmentHandler.CreateDepartment)
			r.Get("/{id}", rt.departmentHandler.GetDepartment)
			r.Put("/{id}", rt.departmentHandler.UpdateDepartment)
			r.Delete("/{id}", rt.departmentHandler.DeleteDepartment)
		})

		// Get departments by faculty
		r.Get("/faculties/{facultyId}/departments", rt.departmentHandler.GetDepartmentsByFaculty)

		// Class routes
		r.Route("/classes", func(r chi.Router) {
			r.Post("/", rt.classHandler.CreateClass)
			r.Get("/{id}", rt.classHandler.GetClass)
			r.Put("/{id}", rt.classHandler.UpdateClass)
			r.Delete("/{id}", rt.classHandler.DeleteClass)
		})

		// Get classes by department
		r.Get("/departments/{departmentId}/classes", rt.classHandler.GetClassesByDepartment)

		// Membership routes
		r.Route("/memberships", func(r chi.Router) {
			r.Post("/", rt.membershipHandler.CreateMembership)
		})

		// Student-specific membership routes
		r.Route("/students/{studentId}/memberships", func(r chi.Router) {
			r.Get("/", rt.membershipHandler.GetMembershipsByStudent)
			r.Get("/current", rt.membershipHandler.GetCurrentMembership)
			r.Post("/transfer", rt.membershipHandler.TransferStudent)
		})

		// Role routes
		r.Route("/roles", func(r chi.Router) {
			r.Post("/", rt.roleHandler.CreateRole)
			r.Get("/", rt.roleHandler.GetAllRoles)
			r.Get("/{id}", rt.roleHandler.GetRole)
			r.Put("/{id}", rt.roleHandler.UpdateRole)
			r.Delete("/{id}", rt.roleHandler.DeleteRole)
		})
	})

	return r
}
