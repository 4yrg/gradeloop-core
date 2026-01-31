package service

import (
	"time"

	"github.com/4yrg/gradeloop-core/services/go/submission/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/repository"
	"github.com/google/uuid"
)

type SubmissionService interface {
	Submit(submission *core.Submission) error
	GetSubmission(id uuid.UUID) (*core.Submission, error)
	ListSubmissions(assignmentID uuid.UUID, studentID string) ([]core.Submission, error)
	UpdateStatus(id uuid.UUID, status core.SubmissionStatus, score int) error
}

type submissionService struct {
	repo repository.Repository
}

func NewSubmissionService(repo repository.Repository) SubmissionService {
	return &submissionService{repo: repo}
}

func (s *submissionService) Submit(submission *core.Submission) error {
	submission.Timestamp = time.Now()
	submission.Status = core.SubmissionStatusPending
	return s.repo.CreateSubmission(submission)
}

func (s *submissionService) GetSubmission(id uuid.UUID) (*core.Submission, error) {
	return s.repo.GetSubmissionByID(id)
}

func (s *submissionService) ListSubmissions(assignmentID uuid.UUID, studentID string) ([]core.Submission, error) {
	return s.repo.ListSubmissions(assignmentID, studentID)
}

func (s *submissionService) UpdateStatus(id uuid.UUID, status core.SubmissionStatus, score int) error {
	return s.repo.UpdateSubmissionStatus(id, status, score)
}
