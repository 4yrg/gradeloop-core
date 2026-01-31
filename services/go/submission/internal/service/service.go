package service

import (
	"context"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/submission/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/repository"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/storage"
	"github.com/google/uuid"
)

type SubmissionService interface {
	Submit(ctx context.Context, submission *core.Submission, fileContents map[string][]byte) error
	GetSubmission(id uuid.UUID) (*core.Submission, error)
	ListSubmissions(assignmentID uuid.UUID, studentID string) ([]core.Submission, error)
	UpdateStatus(id uuid.UUID, status core.SubmissionStatus, score int) error
}

type submissionService struct {
	repo    repository.Repository
	storage storage.StorageClient
}

func NewSubmissionService(repo repository.Repository, storageClient storage.StorageClient) SubmissionService {
	return &submissionService{
		repo:    repo,
		storage: storageClient,
	}
}

func (s *submissionService) Submit(ctx context.Context, submission *core.Submission, fileContents map[string][]byte) error {
	submission.Timestamp = time.Now()
	submission.Status = core.SubmissionStatusPending

	// Upload files to storage and populate file metadata
	for _, file := range submission.Files {
		content, exists := fileContents[file.Filename]
		if !exists {
			continue
		}

		// Upload to Supabase storage
		storageURL, err := s.storage.UploadFile(
			ctx,
			submission.AssignmentID,
			uuid.MustParse(submission.StudentID),
			submission.ID,
			file.Filename,
			content,
		)
		if err != nil {
			return err
		}

		file.StorageURL = storageURL
		file.Size = int64(len(content))
	}

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
