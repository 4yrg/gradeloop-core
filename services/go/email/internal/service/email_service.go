package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"

	"github.com/gradeloop/email-service/internal/models"
	"github.com/gradeloop/email-service/internal/queue"
	"github.com/gradeloop/email-service/internal/store"
)

type EmailService struct {
	store *store.Store
	queue *queue.RabbitMQ
}

func NewEmailService(s *store.Store, q *queue.RabbitMQ) *EmailService {
	return &EmailService{
		store: s,
		queue: q,
	}
}

type SendEmailRequest struct {
	TemplateSlug string                 `json:"template_slug" binding:"required"`
	Recipient    string                 `json:"recipient" binding:"required"`
	Data         map[string]interface{} `json:"data"`
}

func (s *EmailService) QueueEmail(ctx context.Context, req SendEmailRequest) error {
	template, err := s.store.GetTemplateBySlug(req.TemplateSlug)
	if err != nil {
		return fmt.Errorf("template not found: %w", err)
	}

	dataJSON, _ := json.Marshal(req.Data)

	log := &models.EmailLog{
		Recipient:  req.Recipient,
		TemplateID: template.ID,
		Status:     models.StatusPending,
		Data:       string(dataJSON),
	}

	if err := s.store.CreateLog(log); err != nil {
		return fmt.Errorf("failed to create log: %w", err)
	}

	// Payload for queue
	payload := map[string]interface{}{
		"log_id": log.ID.String(),
	}
	payloadJSON, _ := json.Marshal(payload)

	if err := s.queue.Publish(ctx, payloadJSON); err != nil {
		log.Status = models.StatusFailed
		log.LastError = err.Error()
		s.store.UpdateLog(log)
		return fmt.Errorf("failed to publish to queue: %w", err)
	}

	return nil
}

func (s *EmailService) RenderTemplate(htmlTmpl string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("email").Parse(htmlTmpl)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// For multi-recipients
func (s *EmailService) QueueBulkEmail(ctx context.Context, templateSlug string, recipients []string, data map[string]interface{}) error {
	for _, recipient := range recipients {
		req := SendEmailRequest{
			TemplateSlug: templateSlug,
			Recipient:    recipient,
			Data:         data,
		}
		if err := s.QueueEmail(ctx, req); err != nil {
			return err // Or log error and continue
		}
	}
	return nil
}
