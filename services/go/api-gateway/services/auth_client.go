package services

import (
	"context"
	"log"
	"time"

	"github.com/gradeloop/api-gateway/config"
	pb "github.com/gradeloop/core/services/go/shared/proto/auth"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	AuthClient pb.AuthServiceClient
)

func InitAuthClient(cfg *config.Config) {
	conn, err := grpc.Dial(cfg.AuthServiceGRPCURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect to auth service: %v", err)
	}
	// Note: In production we should handle connection closing, but for a gateway we usually keep it alive.
	AuthClient = pb.NewAuthServiceClient(conn)
	log.Printf("Connected to Auth Service gRPC at %s", cfg.AuthServiceGRPCURL)
}

func GetAuthClient() pb.AuthServiceClient {
	return AuthClient
}

// Helper methods for Auth
func LoginGrpc(email, password string) (*pb.LoginResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return AuthClient.Login(ctx, &pb.LoginRequest{
		Email:    email,
		Password: password,
	})
}

func RegisterGrpc(email, name, password, role string) (*pb.RegisterResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return AuthClient.Register(ctx, &pb.RegisterRequest{
		Email:    email,
		Name:     name,
		Password: password,
		Role:     role,
	})
}

func ValidateTokenGrpc(token string) (*pb.ValidateTokenResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return AuthClient.ValidateToken(ctx, &pb.ValidateTokenRequest{
		Token: token,
	})
}

func ForgotPasswordGrpc(email string) (*pb.ForgotPasswordResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return AuthClient.ForgotPassword(ctx, &pb.ForgotPasswordRequest{
		Email: email,
	})
}

func ResetPasswordGrpc(token, password string) (*pb.ResetPasswordResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return AuthClient.ResetPassword(ctx, &pb.ResetPasswordRequest{
		Token:    token,
		Password: password,
	})
}

func InviteUserGrpc(email, role, name string) (*pb.InviteUserResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	return AuthClient.InviteUser(ctx, &pb.InviteUserRequest{
		Email: email,
		Role:  role,
		Name:  name,
	})
}
