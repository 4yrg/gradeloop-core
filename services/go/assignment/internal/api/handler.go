package api

import (
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/assignment/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	svc service.AssignmentService
}

func NewHandler(svc service.AssignmentService) *Handler {
	return &Handler{svc: svc}
}

func SetupRoutes(app *fiber.App, h *Handler) {
	api := app.Group("/api/v1/assignments")

	api.Post("/", h.CreateAssignment)
	api.Get("/", h.ListAssignments)
	api.Get("/:id", h.GetAssignment)
	api.Put("/:id", h.UpdateAssignment)
	api.Delete("/:id", h.DeleteAssignment)
}

func (h *Handler) CreateAssignment(c *fiber.Ctx) error {
	var assignment core.Assignment
	if err := c.BodyParser(&assignment); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if err := h.svc.CreateAssignment(&assignment); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(assignment)
}

func (h *Handler) GetAssignment(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	assignment, err := h.svc.GetAssignment(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Assignment not found"})
	}

	return c.JSON(assignment)
}

func (h *Handler) ListAssignments(c *fiber.Ctx) error {
	courseID := c.Query("courseId")
	assignments, err := h.svc.ListAssignments(courseID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(assignments)
}

func (h *Handler) UpdateAssignment(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	var assignment core.Assignment
	if err := c.BodyParser(&assignment); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}
	assignment.ID = id

	if err := h.svc.UpdateAssignment(&assignment); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(assignment)
}

func (h *Handler) DeleteAssignment(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}

	if err := h.svc.DeleteAssignment(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
