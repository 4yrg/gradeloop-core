package grpc

import (
	"context"

	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/service"
	pb "github.com/4yrg/gradeloop-core/libs/proto/email"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	pb.UnimplementedEmailServiceServer
	emailService *service.EmailService
}

func NewServer(emailService *service.EmailService) *Server {
	return &Server{emailService: emailService}
}

func (s *Server) SendEmail(ctx context.Context, req *pb.SendEmailRequest) (*pb.SendEmailResponse, error) {
	// Convert map[string]string to map[string]interface{}
	data := make(map[string]interface{})
	for k, v := range req.TemplateData {
		data[k] = v
	}

	request := service.SendEmailRequest{
		TemplateSlug: req.TemplateName,
		Recipient:    req.To,
		Data:         data,
	}

	if err := s.emailService.QueueEmail(ctx, request); err != nil {
		return &pb.SendEmailResponse{Success: false}, status.Errorf(codes.Internal, "failed to queue email: %v", err)
	}

	return &pb.SendEmailResponse{
		Success:   true,
		MessageId: "", // ID populated async in log, not returned by QueueEmail immediately
	}, nil
}
