package api

import (
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/submission/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	svc service.SubmissionService
}

func NewHandler(svc service.SubmissionService) *Handler {
	return &Handler{svc: svc}
}

func SetupRoutes(app *fiber.App, h *Handler) {
	api := app.Group("/api/v1/submissions")

	api.Post("/", h.Submit)
	api.Get("/", h.ListSubmissions)
	api.Get("/:id", h.GetSubmission)
	api.Patch("/:id/status", h.UpdateStatus)
}

func (h *Handler) Submit(c *fiber.Ctx) error {
	// Parse the request body
	type SubmitRequest struct {
		AssignmentID       string                   `json:"assignmentId"`
		StudentID          string                   `json:"studentId"`
		Language           string                   `json:"language"`
		Files              []map[string]interface{} `json:"files"` // [{filename: "main.py", content: "..."}]
		AuthFingerprint    string                   `json:"authFingerprint"`
		KeystrokeAnalytics string                   `json:"keystrokeAnalytics"`
	}

	var req SubmitRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// Parse assignment ID
	assignmentID, err := uuid.Parse(req.AssignmentID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid assignment ID"})
	}

	// Create submission
	submission := &core.Submission{
		AssignmentID:       assignmentID,
		StudentID:          req.StudentID,
		Language:           req.Language,
		AuthFingerprint:    req.AuthFingerprint,
		KeystrokeAnalytics: req.KeystrokeAnalytics,
		Files:              make([]core.SubmissionFile, 0),
	}

	// Extract file contents
	fileContents := make(map[string][]byte)
	for _, fileData := range req.Files {
		filename, ok := fileData["filename"].(string)
		if !ok {
			continue
		}
		content, ok := fileData["content"].(string)
		if !ok {
			continue
		}

		submission.Files = append(submission.Files, core.SubmissionFile{
			Filename: filename,
		})
		fileContents[filename] = []byte(content)
	}

	// Submit with file contents
	if err := h.svc.Submit(c.Context(), submission, fileContents); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(submission)
}

func (h *Handler) GetSubmission(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	submission, err := h.svc.GetSubmission(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Submission not found"})
	}

	return c.JSON(submission)
}

func (h *Handler) ListSubmissions(c *fiber.Ctx) error {
	assignmentIDStr := c.Query("assignmentId")
	studentID := c.Query("studentId")

	var assignmentID uuid.UUID
	if assignmentIDStr != "" {
		var err error
		assignmentID, err = uuid.Parse(assignmentIDStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid assignmentId format"})
		}
	}

	submissions, err := h.svc.ListSubmissions(assignmentID, studentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(submissions)
}

func (h *Handler) UpdateStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	var body struct {
		Status core.SubmissionStatus `json:"status"`
		Score  int                   `json:"score"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if err := h.svc.UpdateStatus(id, body.Status, body.Score); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
