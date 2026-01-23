package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/4yrg/gradeloop-core/develop/services/go/authn/internal/config"
	"github.com/4yrg/gradeloop-core/develop/services/go/authn/internal/handlers"
	"github.com/4yrg/gradeloop-core/develop/services/go/authn/internal/service"

	emailpb "github.com/4yrg/gradeloop-core/libs/proto/email"
	sessionpb "github.com/4yrg/gradeloop-core/libs/proto/session"
	userpb "github.com/4yrg/gradeloop-core/libs/proto/user"
)

func main() {
	// 1. Load Config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Connect to Identity Service
	identityConn, err := grpc.Dial(cfg.Services.IdentityServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to Identity Service: %v", err)
	}
	defer identityConn.Close()
	identityClient := userpb.NewUserServiceClient(identityConn)

	// 3. Connect to Session Service
	sessionConn, err := grpc.Dial(cfg.Services.SessionServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to Session Service: %v", err)
	}
	defer sessionConn.Close()
	sessionClient := sessionpb.NewSessionServiceClient(sessionConn)

	// 4. Connect to Email Service
	emailConn, err := grpc.Dial(cfg.Services.EmailServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect to Email Service: %v", err)
	}
	defer emailConn.Close()
	emailClient := emailpb.NewEmailServiceClient(emailConn)

	// 5. Initialize Service & Handlers
	authService := service.NewAuthService(cfg, identityClient, sessionClient, emailClient)
	authHandler := handlers.NewAuthHandler(authService)

	// 6. Setup Fiber
	app := fiber.New(fiber.Config{
		AppName: "AuthN Service",
	})

	app.Use(logger.New())
	app.Use(recover.New())

	// Routes
	api := app.Group("/api")
	v1 := api.Group("/v1")
	auth := v1.Group("/auth")

	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", authHandler.Logout)
	auth.Post("/register", authHandler.Register)

	// 7. Start Server
	go func() {
		addr := fmt.Sprintf(":%s", cfg.Server.Port)
		log.Printf("Starting AuthN Service on %s", addr)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("Server shutdown: %v", err)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	if err := app.Shutdown(); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
