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
	var submission core.Submission
	if err := c.BodyParser(&submission); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if err := h.svc.Submit(&submission); err != nil {
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
