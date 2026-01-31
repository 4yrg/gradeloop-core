package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// StorageClient defines the interface for file storage operations
type StorageClient interface {
	UploadFile(ctx context.Context, assignmentID, studentID, submissionID uuid.UUID, filename string, content []byte) (string, error)
	GetFileURL(path string) string
	DeleteFile(ctx context.Context, path string) error
	DeleteSubmissionFiles(ctx context.Context, assignmentID, studentID, submissionID uuid.UUID) error
}

type supabaseStorage struct {
	url        string
	serviceKey string
	bucket     string
	httpClient *http.Client
}

// NewSupabaseStorage creates a new Supabase storage client
func NewSupabaseStorage() (StorageClient, error) {
	url := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_KEY")
	bucket := os.Getenv("SUPABASE_STORAGE_BUCKET")

	if url == "" || serviceKey == "" || bucket == "" {
		return nil, fmt.Errorf("missing Supabase configuration: SUPABASE_URL, SUPABASE_SERVICE_KEY, or SUPABASE_STORAGE_BUCKET")
	}

	return &supabaseStorage{
		url:        url,
		serviceKey: serviceKey,
		bucket:     bucket,
		httpClient: &http.Client{},
	}, nil
}

// buildPath creates the storage path: submissions/{assignmentId}/{studentId}/{submissionId}/filename
func (s *supabaseStorage) buildPath(assignmentID, studentID, submissionID uuid.UUID, filename string) string {
	return filepath.Join("submissions", assignmentID.String(), studentID.String(), submissionID.String(), filename)
}

// UploadFile uploads a file to Supabase storage
func (s *supabaseStorage) UploadFile(ctx context.Context, assignmentID, studentID, submissionID uuid.UUID, filename string, content []byte) (string, error) {
	path := s.buildPath(assignmentID, studentID, submissionID, filename)

	// Supabase Storage API endpoint
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.url, s.bucket, path)

	req, err := http.NewRequestWithContext(ctx, "POST", uploadURL, bytes.NewReader(content))
	if err != nil {
		return "", fmt.Errorf("failed to create upload request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceKey)
	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	return s.GetFileURL(path), nil
}

// GetFileURL returns the public URL for a file
func (s *supabaseStorage) GetFileURL(path string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.url, s.bucket, path)
}

// DeleteFile deletes a single file from storage
func (s *supabaseStorage) DeleteFile(ctx context.Context, path string) error {
	deleteURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.url, s.bucket, path)

	req, err := http.NewRequestWithContext(ctx, "DELETE", deleteURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// DeleteSubmissionFiles deletes all files for a submission
func (s *supabaseStorage) DeleteSubmissionFiles(ctx context.Context, assignmentID, studentID, submissionID uuid.UUID) error {
	// In a real implementation, you'd list all files in the directory and delete them
	// For now, this is a placeholder that would need to be implemented based on your needs
	prefix := filepath.Join("submissions", assignmentID.String(), studentID.String(), submissionID.String())

	// Supabase doesn't have a direct "delete folder" API, so you'd need to:
	// 1. List all files with the prefix
	// 2. Delete each file individually
	// This is a simplified version - you may want to implement batch deletion

	_ = prefix // Placeholder to avoid unused variable error
	return nil
}
