package service

import (
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/repository"
	"github.com/google/uuid"
)

type AssignmentService interface {
	CreateAssignment(assignment *core.Assignment) error
	GetAssignment(id uuid.UUID) (*core.Assignment, error)
	ListAssignments(courseID string) ([]core.Assignment, error)
	UpdateAssignment(assignment *core.Assignment) error
	DeleteAssignment(id uuid.UUID) error
}

type assignmentService struct {
	repo repository.Repository
}

func NewAssignmentService(repo repository.Repository) AssignmentService {
	return &assignmentService{repo: repo}
}

func (s *assignmentService) CreateAssignment(assignment *core.Assignment) error {
	// Add any business validation here
	return s.repo.CreateAssignment(assignment)
}

func (s *assignmentService) GetAssignment(id uuid.UUID) (*core.Assignment, error) {
	return s.repo.GetAssignmentByID(id)
}

func (s *assignmentService) ListAssignments(courseID string) ([]core.Assignment, error) {
	return s.repo.ListAssignments(courseID)
}

func (s *assignmentService) UpdateAssignment(assignment *core.Assignment) error {
	return s.repo.UpdateAssignment(assignment)
}

func (s *assignmentService) DeleteAssignment(id uuid.UUID) error {
	return s.repo.DeleteAssignment(id)
}
