package handlers

import (
	"context"
	"errors"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gradeloop/auth-service/database"
	"github.com/gradeloop/auth-service/middleware"
	"github.com/gradeloop/auth-service/models"
	pb "github.com/gradeloop/core/services/go/shared/proto/auth"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type AuthGrpcServer struct {
	pb.UnimplementedAuthServiceServer
}

func (s *AuthGrpcServer) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Error(codes.Internal, "Could not hash password")
	}

	user := models.User{
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: string(hash),
		Role:         models.Role(req.Role),
	}

	if result := database.DB.Create(&user); result.Error != nil {
		return nil, status.Error(codes.AlreadyExists, "User already exists")
	}

	token, err := middleware.GenerateToken(user.ID.String(), string(user.Role))
	if err != nil {
		return nil, status.Error(codes.Internal, "Could not generate token")
	}

	return &pb.RegisterResponse{
		Id:    user.ID.String(),
		Token: token,
	}, nil
}

func (s *AuthGrpcServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.Unauthenticated, "Invalid credentials")
		}
		return nil, status.Error(codes.Internal, "Database error")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, status.Error(codes.Unauthenticated, "Invalid credentials")
	}

	token, err := middleware.GenerateToken(user.ID.String(), string(user.Role))
	if err != nil {
		return nil, status.Error(codes.Internal, "Could not generate token")
	}

	return &pb.LoginResponse{
		Token: token,
	}, nil
}

func (s *AuthGrpcServer) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	token, err := jwt.Parse(req.Token, func(token *jwt.Token) (interface{}, error) {
		return middleware.SecretKey, nil
	})

	if err != nil || !token.Valid {
		return &pb.ValidateTokenResponse{Valid: false}, nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return &pb.ValidateTokenResponse{Valid: false}, nil
	}

	userID, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)

	return &pb.ValidateTokenResponse{
		Valid:  true,
		UserId: userID,
		Role:   role,
	}, nil
}
