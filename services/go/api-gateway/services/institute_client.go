package services

import (
	"context"
	"log"
	"os"
	"time"

	pb "github.com/gradeloop/core/services/go/shared/proto/institute"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	InstituteClient pb.InstituteServiceClient
)

func InitInstituteClient() {
	serviceURL := os.Getenv("INSTITUTE_SERVICE_URL")
	if serviceURL == "" {
		serviceURL = "institute-service:50052"
	}

	conn, err := grpc.Dial(serviceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect to institute service: %v", err)
	}

	InstituteClient = pb.NewInstituteServiceClient(conn)
	log.Printf("Connected to Institute Service gRPC at %s", serviceURL)
}

func GetInstituteClient() pb.InstituteServiceClient {
	return InstituteClient
}

func CreateInstituteGrpc(name, code string) (*pb.CreateInstituteResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return InstituteClient.CreateInstitute(ctx, &pb.CreateInstituteRequest{
		Name: name,
		Code: code,
	})
}

func AddInstituteAdminGrpc(instituteID, userID string) (*pb.AddInstituteAdminResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return InstituteClient.AddInstituteAdmin(ctx, &pb.AddInstituteAdminRequest{
		InstituteId: instituteID,
		UserId:      userID,
	})
}
