package grpc

import (
	"context"

	pb "github.com/4yrg/gradeloop-core/libs/proto/session"
	"github.com/gradeloop/session-service/internal/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	pb.UnimplementedSessionServiceServer
	svc *service.SessionService
}

func NewServer(svc *service.SessionService) *Server {
	return &Server{svc: svc}
}

func (s *Server) CreateSession(ctx context.Context, req *pb.CreateSessionRequest) (*pb.Session, error) {
	input := service.CreateSessionInput{
		UserID:    req.UserId,
		UserRole:  req.UserRole,
		UserAgent: req.UserAgent,
		ClientIP:  req.ClientIp,
	}

	tokens, err := s.svc.CreateSession(ctx, input)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create session: %v", err)
	}

	return &pb.Session{
		Id:           tokens.SessionID,
		UserId:       req.UserId,
		UserRole:     req.UserRole,
		RefreshToken: tokens.RefreshToken,
		UserAgent:    req.UserAgent,
		ClientIp:     req.ClientIp,
		IsRevoked:    false,
		ExpiresAt:    tokens.ExpiresAt.Unix(),
		CreatedAt:    tokens.ExpiresAt.Add(-service.AccessTokenTTL).Unix(), // Approx
	}, nil
}

func (s *Server) GetSession(ctx context.Context, req *pb.GetSessionRequest) (*pb.Session, error) {
	cached, err := s.svc.ValidateSession(ctx, req.SessionId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to validate session: %v", err)
	}
	if cached == nil {
		return nil, status.Error(codes.NotFound, "session not found or invalid")
	}

	return &pb.Session{
		Id:        cached.ID,
		UserId:    cached.UserID,
		UserRole:  cached.UserRole,
		UserAgent: cached.UserAgent,
		ClientIp:  cached.ClientIP,
		ExpiresAt: cached.ExpiresAt.Unix(),
	}, nil
}

func (s *Server) RefreshSession(ctx context.Context, req *pb.RefreshSessionRequest) (*pb.Session, error) {
	tokens, err := s.svc.RefreshSession(ctx, req.SessionId, req.OldRefreshToken)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "failed to refresh session: %v", err)
	}

	// We need to return a Session object, but RefreshSession returns tokens.
	// We can construct a minimal Session object or fetch full session.
	// The caller (AuthN) likely just needs the new tokens.
	// The proto returns `Session`.

	// Let's reconstruct what we can.
	return &pb.Session{
		Id:           tokens.SessionID,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt.Unix(),
	}, nil
}

func (s *Server) RevokeSession(ctx context.Context, req *pb.RevokeSessionRequest) (*pb.RevokeSessionResponse, error) {
	if err := s.svc.RevokeSession(ctx, req.SessionId, ""); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to revoke session: %v", err)
	}
	return &pb.RevokeSessionResponse{Success: true}, nil
}

func (s *Server) RevokeAllUserSessions(ctx context.Context, req *pb.RevokeAllUserSessionsRequest) (*pb.RevokeAllUserSessionsResponse, error) {
	if err := s.svc.RevokeUserSessions(ctx, req.UserId); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to revoke user sessions: %v", err)
	}
	return &pb.RevokeAllUserSessionsResponse{RevokedCount: 0}, nil // Count not supported by service yet
}
