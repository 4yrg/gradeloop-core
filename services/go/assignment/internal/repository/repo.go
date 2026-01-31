package repository

import (
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/core"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	AutoMigrate() error
	CreateAssignment(assignment *core.Assignment) error
	GetAssignmentByID(id uuid.UUID) (*core.Assignment, error)
	ListAssignments(courseID string) ([]core.Assignment, error)
	UpdateAssignment(assignment *core.Assignment) error
	DeleteAssignment(id uuid.UUID) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&core.Assignment{},
		&core.RubricItem{},
		&core.AssignmentConstraint{},
		&core.AssignmentLanguage{},
	)
}

func (r *repository) CreateAssignment(assignment *core.Assignment) error {
	return r.db.Create(assignment).Error
}

func (r *repository) GetAssignmentByID(id uuid.UUID) (*core.Assignment, error) {
	var assignment core.Assignment
	err := r.db.Preload("Rubric").Preload("Constraints").Preload("Languages").First(&assignment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *repository) ListAssignments(courseID string) ([]core.Assignment, error) {
	var assignments []core.Assignment
	query := r.db.Preload("Rubric").Preload("Constraints").Preload("Languages")
	if courseID != "" {
		query = query.Where("course_id = ?", courseID)
	}
	err := query.Find(&assignments).Error
	return assignments, err
}

func (r *repository) UpdateAssignment(assignment *core.Assignment) error {
	return r.db.Save(assignment).Error
}

func (r *repository) DeleteAssignment(id uuid.UUID) error {
	return r.db.Delete(&core.Assignment{}, "id = ?", id).Error
}
