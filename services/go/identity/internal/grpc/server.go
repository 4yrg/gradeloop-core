package grpc

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/service"
	pb "github.com/4yrg/gradeloop-core/libs/proto/user"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	pb.UnimplementedUserServiceServer
	userService service.UserService
}

func NewServer(userService service.UserService) *Server {
	return &Server{userService: userService}
}

func (s *Server) ValidateCredentials(ctx context.Context, req *pb.ValidateCredentialsRequest) (*pb.ValidateCredentialsResponse, error) {
	user, valid, err := s.userService.ValidateCredentials(req.Email, req.Password)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to validate credentials: %v", err)
	}

	if !valid || user == nil {
		return &pb.ValidateCredentialsResponse{Valid: false}, nil
	}

	return &pb.ValidateCredentialsResponse{
		Valid: true,
		User: &pb.UserResponse{
			UserId: user.ID,
			Email:  user.Email,
		},
	}, nil
}

func (s *Server) UpdatePassword(ctx context.Context, req *pb.UpdatePasswordRequest) (*pb.UpdatePasswordResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	if err := s.userService.UpdatePassword(req.UserId, req.NewPassword); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update password: %v", err)
	}

	return &pb.UpdatePasswordResponse{Success: true}, nil
}

func (s *Server) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.UserProfile, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	user, err := s.userService.GetUserByID(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "user not found: %v", err)
	}

	role := string(user.UserType)
	instituteID := ""

	// Get institute ID based on user type
	if user.InstituteAdmin != nil && user.InstituteAdmin.InstituteID != "" {
		instituteID = user.InstituteAdmin.InstituteID
	}

	// Split name into first and last (simple split)
	firstName := user.Name
	lastName := ""

	return &pb.UserProfile{
		Id:          user.ID,
		FirstName:   firstName,
		LastName:    lastName,
		Email:       user.Email,
		InstituteId: instituteID,
		Role:        role,
		AvatarUrl:   "",
	}, nil
}

func (s *Server) CreateStudent(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {
	return s.createUserByType(ctx, req, models.UserTypeStudent)
}

func (s *Server) CreateInstructor(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {
	return s.createUserByType(ctx, req, models.UserTypeInstructor)
}

func (s *Server) CreateInstituteAdmin(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {
	return s.createUserByType(ctx, req, models.UserTypeInstituteAdmin)
}

func (s *Server) createUserByType(ctx context.Context, req *pb.CreateUserRequest, userType models.UserType) (*pb.UserResponse, error) {
	log.Printf("[DEBUG] Creating user with type: %s, email: %s", userType, req.Email)

	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}
	if req.FirstName == "" {
		return nil, status.Error(codes.InvalidArgument, "first_name is required")
	}

	// Generate temporary password
	tempPassword, err := generateTempPassword()
	if err != nil {
		log.Printf("[ERROR] Failed to generate temp password: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to generate temp password: %v", err)
	}

	// Hash the password before creating user
	hashedPassword, err := hashPassword(tempPassword)
	if err != nil {
		log.Printf("[ERROR] Failed to hash password: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to hash password: %v", err)
	}

	// Combine first and last name
	name := req.FirstName
	if req.LastName != "" {
		name = req.FirstName + " " + req.LastName
	}

	user := &models.User{
		Email:        req.Email,
		Name:         name,
		UserType:     userType,
		PasswordHash: hashedPassword,
		IsActive:     true,
	}

	// Add type-specific data with proper initialization
	switch userType {
	case models.UserTypeStudent:
		studentID := req.EnrollmentNumber
		if studentID == "" {
			// Generate a unique student ID using timestamp
			studentID = fmt.Sprintf("STU%d", time.Now().UnixNano()/1000)
		}
		log.Printf("[DEBUG] Creating student with ID: %s", studentID)
		user.Student = &models.Student{
			StudentID: studentID,
		}
	case models.UserTypeInstructor:
		employeeID := req.Specialization
		if employeeID == "" {
			// Generate a unique employee ID using timestamp
			employeeID = fmt.Sprintf("INS%d", time.Now().UnixNano()/1000)
		}
		log.Printf("[DEBUG] Creating instructor with employee ID: %s", employeeID)
		user.Instructor = &models.Instructor{
			EmployeeID: employeeID,
		}
	case models.UserTypeInstituteAdmin:
		instituteID := req.InstituteId
		if instituteID == "" {
			// Should validation fail here if instituteID is empty?
			// But for now keeping logic same as before just type change
		}
		log.Printf("[DEBUG] Creating institute admin with institute ID: %s", instituteID)
		user.InstituteAdmin = &models.InstituteAdmin{
			InstituteID: instituteID,
		}
	}

	// Create user (password hash already set)
	log.Printf("[DEBUG] Calling userService.CreateUser for email: %s", user.Email)
	if err := s.userService.CreateUser(user); err != nil {
		log.Printf("[ERROR] Failed to create user %s: %v", user.Email, err)
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	log.Printf("[SUCCESS] User created successfully with ID: %s, email: %s", user.ID, user.Email)
	return &pb.UserResponse{
		UserId:       user.ID,
		Email:        user.Email,
		TempPassword: tempPassword,
	}, nil
}

func generateTempPassword() (string, error) {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b)[:16], nil
}

func hashPassword(password string) (string, error) {
	// Import bcrypt at the top if not already imported
	// Using a simple approach - in production, use bcrypt
	// For now, we'll import golang.org/x/crypto/bcrypt
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
