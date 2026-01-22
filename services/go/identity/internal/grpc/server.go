package grpc

import (
	"context"
	"strconv"

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
			UserId: fmtUint(user.ID),
			Email:  user.Email,
		},
	}, nil
}

func (s *Server) UpdatePassword(ctx context.Context, req *pb.UpdatePasswordRequest) (*pb.UpdatePasswordResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	id, err := strconv.ParseUint(req.UserId, 10, 32)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}

	if err := s.userService.UpdatePassword(uint(id), req.NewPassword); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update password: %v", err)
	}

	return &pb.UpdatePasswordResponse{Success: true}, nil
}

// Helper
func fmtUint(i uint) string {
	return strconv.FormatUint(uint64(i), 10)
}
