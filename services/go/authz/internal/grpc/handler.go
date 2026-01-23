package grpc

import (
	"context"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/service"
	authzpb "github.com/4yrg/gradeloop-core/libs/proto/authz"
)

type AuthzHandler struct {
	authzpb.UnimplementedAuthorizationServiceServer
	service service.AuthzService
}

func NewAuthzHandler(svc service.AuthzService) *AuthzHandler {
	return &AuthzHandler{service: svc}
}

func (h *AuthzHandler) CheckPermission(ctx context.Context, req *authzpb.CheckRequest) (*authzpb.CheckResponse, error) {
	sreq := service.CheckRequest{
		UserID:     req.UserId,
		Roles:      req.Roles,
		TenantID:   req.TenantId,
		Resource:   req.Resource,
		Action:     req.Action,
		Attributes: req.Attributes,
	}

	res, err := h.service.CheckPermission(ctx, sreq)
	if err != nil {
		return nil, err
	}

	return &authzpb.CheckResponse{
		Allowed: res.Allowed,
		Reason:  res.Reason,
	}, nil
}

func (h *AuthzHandler) BatchCheck(ctx context.Context, req *authzpb.BatchCheckRequest) (*authzpb.BatchCheckResponse, error) {
	results := make([]*authzpb.CheckResponse, len(req.Items))

	for i, item := range req.Items {
		sreq := service.CheckRequest{
			UserID:     req.UserId,
			Roles:      req.Roles,
			TenantID:   req.TenantId,
			Resource:   item.Resource,
			Action:     item.Action,
			Attributes: item.Attributes,
		}

		res, err := h.service.CheckPermission(ctx, sreq)
		if err != nil {
			results[i] = &authzpb.CheckResponse{Allowed: false, Reason: "Internal error"}
			continue
		}

		results[i] = &authzpb.CheckResponse{
			Allowed: res.Allowed,
			Reason:  res.Reason,
		}
	}

	return &authzpb.BatchCheckResponse{Results: results}, nil
}
