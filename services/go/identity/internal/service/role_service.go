package service

import (
	"fmt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/go-playground/validator/v10"
)

type RoleService interface {
	CreateRole(role *models.Role) error
	GetRoleByID(id string) (*models.Role, error)
	GetAllRoles(limit, offset int) ([]models.Role, int64, error)
	UpdateRole(role *models.Role) error
	DeleteRole(id string) error
}

type roleService struct {
	roleRepo repository.RoleRepository
	validate *validator.Validate
}

func NewRoleService(roleRepo repository.RoleRepository) RoleService {
	return &roleService{
		roleRepo: roleRepo,
		validate: validator.New(),
	}
}

func (s *roleService) CreateRole(role *models.Role) error {
	if err := s.validate.Struct(role); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.roleRepo.Create(role)
}

func (s *roleService) GetRoleByID(id string) (*models.Role, error) {
	return s.roleRepo.GetByID(id)
}

func (s *roleService) GetAllRoles(limit, offset int) ([]models.Role, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.roleRepo.GetAll(limit, offset)
}

func (s *roleService) UpdateRole(role *models.Role) error {
	if err := s.validate.Struct(role); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.roleRepo.Update(role)
}

func (s *roleService) DeleteRole(id string) error {
	return s.roleRepo.Delete(id)
}
