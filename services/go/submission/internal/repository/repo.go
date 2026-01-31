package repository

import (
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/core"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	AutoMigrate() error
	CreateSubmission(submission *core.Submission) error
	GetSubmissionByID(id uuid.UUID) (*core.Submission, error)
	ListSubmissions(assignmentID uuid.UUID, studentID string) ([]core.Submission, error)
	UpdateSubmissionStatus(id uuid.UUID, status core.SubmissionStatus, score int) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&core.Submission{},
		&core.SubmissionFile{},
		&core.VivaTranscriptTurn{},
		&core.IntegritySignal{},
	)
}

func (r *repository) CreateSubmission(submission *core.Submission) error {
	return r.db.Create(submission).Error
}

func (r *repository) GetSubmissionByID(id uuid.UUID) (*core.Submission, error) {
	var submission core.Submission
	err := r.db.Preload("Files").Preload("VivaTurns").Preload("Integrity").First(&submission, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *repository) ListSubmissions(assignmentID uuid.UUID, studentID string) ([]core.Submission, error) {
	var submissions []core.Submission
	query := r.db.Preload("Files")
	if assignmentID != uuid.Nil {
		query = query.Where("assignment_id = ?", assignmentID)
	}
	if studentID != "" {
		query = query.Where("student_id = ?", studentID)
	}
	err := query.Find(&submissions).Error
	return submissions, err
}

func (r *repository) UpdateSubmissionStatus(id uuid.UUID, status core.SubmissionStatus, score int) error {
	return r.db.Model(&core.Submission{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status": status,
		"score":  score,
	}).Error
}
