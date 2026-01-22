package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"

	pb "github.com/4yrg/gradeloop-core/libs/proto/email"
	"github.com/gradeloop/email-service/internal/config"
	internalgrpc "github.com/gradeloop/email-service/internal/grpc"
	"github.com/gradeloop/email-service/internal/queue"
	"github.com/gradeloop/email-service/internal/routes"
	"github.com/gradeloop/email-service/internal/service"
	"github.com/gradeloop/email-service/internal/store"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	s, err := store.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer s.Close()

	// Run migrations
	if err := s.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize RabbitMQ
	q, err := queue.New(cfg.RabbitMQ)
	if err != nil {
		log.Fatalf("Failed to initialize RabbitMQ: %v", err)
	}
	defer q.Close()

	// Initialize services
	emailService := service.NewEmailService(s, q)
	worker := service.NewWorker(s, q, emailService, cfg.SMTP)

	// Setup routes
	router := routes.SetupRouter(s, emailService)

	// Start gRPC Server
	grpcServer := grpc.NewServer()
	emailGrpcServer := internalgrpc.NewServer(emailService)
	pb.RegisterEmailServiceServer(grpcServer, emailGrpcServer)

	go func() {
		lis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.Server.GrpcPort))
		if err != nil {
			log.Fatalf("failed to listen for gRPC: %v", err)
		}
		log.Printf("gRPC server listening on :%s", cfg.Server.GrpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// Start worker in a goroutine
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go worker.Start(ctx)

	// Start server
	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	go func() {
		log.Printf("Starting server on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	cancel() // Stop worker

	ctxClose, cancelClose := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelClose()
	if err := srv.Shutdown(ctxClose); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
