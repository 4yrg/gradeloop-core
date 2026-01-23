package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"

	pb "github.com/4yrg/gradeloop-core/libs/proto/session"
	"github.com/gofiber/fiber/v2"
	"github.com/gradeloop/session-service/internal/cache"
	"github.com/gradeloop/session-service/internal/config"
	internalgrpc "github.com/gradeloop/session-service/internal/grpc"
	"github.com/gradeloop/session-service/internal/handlers"
	"github.com/gradeloop/session-service/internal/routes"
	"github.com/gradeloop/session-service/internal/service"
	"github.com/gradeloop/session-service/internal/store"
)

func main() {
	// 1. Load Config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Initialize Database Store
	storeLayer, err := store.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize store: %v", err)
	}

	// 3. Initialize Redis Cache
	cacheLayer, err := cache.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize cache: %v", err)
	}

	// 4. Initialize Service
	svc := service.New(storeLayer, cacheLayer)

	// 5. Initialize Handlers
	h := handlers.New(svc)

	// 6. Setup Fiber App
	app := fiber.New(fiber.Config{
		AppName: "Session Service",
	})

	routes.SetupRoutes(app, h)

	// Start gRPC Server
	grpcServer := grpc.NewServer()
	sessionGrpcServer := internalgrpc.NewServer(svc)
	pb.RegisterSessionServiceServer(grpcServer, sessionGrpcServer)

	go func() {
		lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GrpcPort))
		if err != nil {
			log.Fatalf("failed to listen for gRPC: %v", err)
		}
		log.Printf("gRPC server listening on :%s", cfg.GrpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// 7. Start Server
	go func() {
		addr := fmt.Sprintf(":%s", cfg.AppPort)
		log.Printf("Starting server on %s", addr)
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

	// Close resources if needed (Redis/DB)
	// GORM and go-redis handle pooling, but explicit Close() is good if exposed.
	// (Not exposed in my current wrappers, but OS passing helps).

	log.Println("Server exited")
}
