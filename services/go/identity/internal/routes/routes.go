package routes

import (
	"net/http"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type Router struct {
	userHandler *handlers.UserHandler
}

func NewRouter(userHandler *handlers.UserHandler) *Router {
	return &Router{
		userHandler: userHandler,
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
	})

	return r
}
