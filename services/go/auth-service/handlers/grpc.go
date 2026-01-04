package handlers

import (
	"context"
	"errors"
	"log"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gradeloop/auth-service/database"
	"github.com/gradeloop/auth-service/middleware"
	"github.com/gradeloop/auth-service/models"
	"github.com/gradeloop/auth-service/services"
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

	log.Printf("gRPC Register request received for email: %s", req.Email)

	user := models.User{
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: string(hash),
		Role:         models.Role(req.Role),
	}

	if result := database.DB.Create(&user); result.Error != nil {
		log.Printf("gRPC Register error (Create User): %v", result.Error)
		return nil, status.Error(codes.AlreadyExists, "Registration failed: "+result.Error.Error())
	}

	log.Printf("gRPC User registered successfully: %s", user.ID)

	token, err := middleware.GenerateToken(user.ID.String(), string(user.Role))
	if err != nil {
		return nil, status.Error(codes.Internal, "Could not generate token")
	}

	return &pb.RegisterResponse{
		Id:    user.ID.String(),
		Token: token,
		Name:  user.Name,
		Email: user.Email,
		Role:  string(user.Role),
	}, nil
}

func (s *AuthGrpcServer) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	log.Printf("gRPC Login request received for email: %s", req.Email)

	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		log.Printf("gRPC Login error (User not found): %v", result.Error)
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.Unauthenticated, "Invalid credentials")
		}
		return nil, status.Error(codes.Internal, "Database error")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		log.Printf("gRPC Login error (Password mismatch) for user: %s", req.Email)
		return nil, status.Error(codes.Unauthenticated, "Invalid credentials")
	}

	log.Printf("gRPC User logged in successfully: %s", user.ID)

	token, err := middleware.GenerateToken(user.ID.String(), string(user.Role))
	if err != nil {
		return nil, status.Error(codes.Internal, "Could not generate token")
	}

	return &pb.LoginResponse{
		Token:  token,
		UserId: user.ID.String(),
		Email:  user.Email,
		Name:   user.Name,
		Role:   string(user.Role),
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

func (s *AuthGrpcServer) InviteUser(ctx context.Context, req *pb.InviteUserRequest) (*pb.InviteUserResponse, error) {
	// 1. Check if user exists
	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error == nil {
		return nil, status.Error(codes.AlreadyExists, "User already exists")
	}

	// 2. Create User with random password (they must reset it)
	// Using a random long string for password so it can't be guessed
	randomPwd := uuid.New().String() + uuid.New().String()
	hash, err := bcrypt.GenerateFromPassword([]byte(randomPwd), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Error(codes.Internal, "Could not hash password")
	}

	user = models.User{
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: string(hash),
		Role:         models.Role(req.Role),
	}

	if result := database.DB.Create(&user); result.Error != nil {
		return nil, status.Error(codes.Internal, "Failed to create user: "+result.Error.Error())
	}

	// 3. Generate Reset Token
	token, err := services.CreatePasswordResetToken(req.Email) // This saves token to DB
	if err != nil {
		return nil, status.Error(codes.Internal, "Failed to generate reset token: "+err.Error())
	}

	// 4. Return response
	return &pb.InviteUserResponse{
		UserId:     user.ID.String(),
		ResetToken: token,
	}, nil
}
