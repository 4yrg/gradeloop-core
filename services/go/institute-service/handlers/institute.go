package handlers

import (
	"context"
	"errors"

	pb "github.com/gradeloop/core/services/go/shared/proto/institute"
	"github.com/gradeloop/institute-service/database"
	"github.com/gradeloop/institute-service/models"
)

type InstituteHandler struct {
	pb.UnimplementedInstituteServiceServer
}

func (h *InstituteHandler) CreateInstitute(ctx context.Context, req *pb.CreateInstituteRequest) (*pb.CreateInstituteResponse, error) {
	institute := models.Institute{
		Name: req.Name,
		Code: req.Code,
	}

	if result := database.DB.Create(&institute); result.Error != nil {
		return nil, result.Error
	}

	return &pb.CreateInstituteResponse{
		Institute: &pb.Institute{
			Id:        institute.ID.String(),
			Name:      institute.Name,
			Code:      institute.Code,
			CreatedAt: institute.CreatedAt.String(),
		},
	}, nil
}

func (h *InstituteHandler) AddInstituteAdmin(ctx context.Context, req *pb.AddInstituteAdminRequest) (*pb.AddInstituteAdminResponse, error) {
	admin := models.InstituteAdmin{
		InstituteID: req.InstituteId,
		UserID:      req.UserId,
	}

	if result := database.DB.Create(&admin); result.Error != nil {
		return &pb.AddInstituteAdminResponse{Success: false}, result.Error
	}

	return &pb.AddInstituteAdminResponse{Success: true}, nil
}

func (h *InstituteHandler) GetInstitute(ctx context.Context, req *pb.GetInstituteRequest) (*pb.GetInstituteResponse, error) {
	var institute models.Institute
	if result := database.DB.Where("id = ?", req.Id).First(&institute); result.Error != nil {
		return nil, errors.New("institute not found")
	}

	return &pb.GetInstituteResponse{
		Institute: &pb.Institute{
			Id:        institute.ID.String(),
			Name:      institute.Name,
			Code:      institute.Code,
			CreatedAt: institute.CreatedAt.String(),
		},
	}, nil
}
