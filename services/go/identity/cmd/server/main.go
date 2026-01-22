package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/config"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/database"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/handlers"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/routes"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/service"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Starting Identity Service in %s mode...", cfg.Environment)

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Run migrations
	if err := db.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Database migrations completed successfully")

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.DB)
	instituteRepo := repository.NewInstituteRepository(db.DB)
	facultyRepo := repository.NewFacultyRepository(db.DB)
	departmentRepo := repository.NewDepartmentRepository(db.DB)
	classRepo := repository.NewClassRepository(db.DB)
	membershipRepo := repository.NewMembershipRepository(db.DB)
	roleRepo := repository.NewRoleRepository(db.DB)

	// Initialize services
	userService := service.NewUserService(userRepo)
	instituteService := service.NewInstituteService(instituteRepo)
	facultyService := service.NewFacultyService(facultyRepo)
	departmentService := service.NewDepartmentService(departmentRepo)
	classService := service.NewClassService(classRepo)
	membershipService := service.NewMembershipService(membershipRepo)
	roleService := service.NewRoleService(roleRepo)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService)
	instituteHandler := handlers.NewInstituteHandler(instituteService)
	facultyHandler := handlers.NewFacultyHandler(facultyService)
	departmentHandler := handlers.NewDepartmentHandler(departmentService)
	classHandler := handlers.NewClassHandler(classService)
	membershipHandler := handlers.NewMembershipHandler(membershipService)
	roleHandler := handlers.NewRoleHandler(roleService)

	// Setup routes
	router := routes.NewRouter(
		userHandler,
		instituteHandler,
		facultyHandler,
		departmentHandler,
		classHandler,
		membershipHandler,
		roleHandler,
	)
	r := router.Setup()

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Server starting on %s", addr)

	// Graceful shutdown
	server := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	if err := db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	log.Println("Server stopped")
}
