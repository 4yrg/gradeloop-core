package api

import (
	"log"

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

func (h *Handler) SendTemplateEmail(c *fiber.Ctx) error {
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

	return c.JSON(fiber.Map{"status": "queued"})
}

func (h *Handler) SendRawEmail(c *fiber.Ctx) error {
	var req struct {
		To      string `json:"to"`
		Subject string `json:"subject"`
		Body    string `json:"body"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	log.Printf("[Email Handler] Received Raw Email request to: %s", req.To)

	if err := h.emailSvc.SendRaw(req.To, req.Subject, req.Body); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *Handler) CreateTemplate(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Subject  string `json:"subject"`
		HTMLBody string `json:"html_body"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Name == "" || req.Subject == "" || req.HTMLBody == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name, subject, and html_body are required"})
	}

	if err := h.tmplSvc.CreateTemplate(req.Name, req.Subject, req.HTMLBody); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *Handler) GetLogs(c *fiber.Ctx) error {
	logs, err := h.emailSvc.GetLogs()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(logs)
}

func (h *Handler) ListTemplates(c *fiber.Ctx) error {
	templates, err := h.tmplSvc.ListTemplates()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(templates)
}

func (h *Handler) GetTemplate(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "template name required"})
	}

	template, err := h.tmplSvc.GetTemplate(name)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "template not found"})
	}
	return c.JSON(template)
}
