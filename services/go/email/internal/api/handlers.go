package api

import (
	"github.com/4yrg/gradeloop-core/services/go/email/internal/service"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	emailSvc *service.EmailService
	tmplSvc  *service.TemplateService
}

func NewHandler(emailSvc *service.EmailService, tmplSvc *service.TemplateService) *Handler {
	return &Handler{
		emailSvc: emailSvc,
		tmplSvc:  tmplSvc,
	}
}

type SendRequest struct {
	TemplateName string                 `json:"template_name"`
	Recipient    string                 `json:"recipient"`
	Data         map[string]interface{} `json:"data"`
}

func (h *Handler) SendEmail(c *fiber.Ctx) error {
	var req SendRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.TemplateName == "" || req.Recipient == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "template_name and recipient are required"})
	}

	if err := h.emailSvc.SendEmail(req.TemplateName, req.Recipient, req.Data); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "sent"})
}

func (h *Handler) ListTemplates(c *fiber.Ctx) error {
	templates, err := h.tmplSvc.ListTemplates()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(templates)
}
