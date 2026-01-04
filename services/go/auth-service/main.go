package main

import (
	"log"
	"net"
	"os"

	"net"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gradeloop/auth-service/database"
	"github.com/gradeloop/auth-service/handlers"
	"github.com/gradeloop/auth-service/middleware"
	pb "github.com/gradeloop/core/services/go/shared/proto/auth"
	"google.golang.org/grpc"
)

func main() {
	database.ConnectDB()

	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New())

	api := app.Group("/auth")

	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/me", middleware.Protected(), handlers.Me)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start gRPC Server
	go func() {
		lis, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("failed to listen: %v", err)
		}
		grpcServer := grpc.NewServer()
		pb.RegisterAuthServiceServer(grpcServer, &handlers.AuthGrpcServer{})
		log.Println("gRPC server listening on :50051")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve: %v", err)
		}
	}()

	log.Fatal(app.Listen(":" + port))
}
