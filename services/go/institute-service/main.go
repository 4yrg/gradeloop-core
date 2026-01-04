package main

import (
	"log"
	"net"

	pb "github.com/gradeloop/core/services/go/shared/proto/institute"
	"github.com/gradeloop/institute-service/database"
	"github.com/gradeloop/institute-service/handlers"
	"google.golang.org/grpc"
)

func main() {
	// Connect to Database
	database.Connect()

	// Start gRPC server
	lis, err := net.Listen("tcp", ":50052") // Specific port for institute service
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterInstituteServiceServer(s, &handlers.InstituteHandler{})

	log.Printf("Institute Service listening on :50052")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
