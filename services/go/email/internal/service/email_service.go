package service

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/4yrg/gradeloop-core/services/go/email/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/email/internal/repository"
)

type EmailService struct {
	provider    core.EmailProvider
	templateSvc core.TemplateService
	repo        *repository.Repository
}

func NewEmailService(provider core.EmailProvider, templateSvc core.TemplateService, repo *repository.Repository) *EmailService {
	return &EmailService{
		provider:    provider,
		templateSvc: templateSvc,
		repo:        repo,
	}
}

func (s *EmailService) SendEmail(templateName string, recipient string, data map[string]interface{}) error {
	// 1. Log request (pending)
	payloadBytes, _ := json.Marshal(data)
	reqLog := &core.EmailRequestLog{
		TemplateName:   templateName,
		RecipientEmail: recipient,
		Payload:        string(payloadBytes),
		Status:         core.StatusPending,
		CreatedAt:      time.Now(),
	}
	if err := s.repo.CreateRequestLog(reqLog); err != nil {
		log.Printf("Failed to create request log: %v", err)
		// Proceed anyway? Or fail? Fail is safer for audit.
		return fmt.Errorf("failed to log request: %w", err)
	}

	// 2. Get Template
	tmpl, err := s.templateSvc.GetTemplate(templateName)
	if err != nil {
		s.failLog(reqLog, fmt.Sprintf("Template error: %v", err))
		return err
	}

	// 3. Render
	body, err := s.templateSvc.Render(tmpl, data)
	if err != nil {
		s.failLog(reqLog, fmt.Sprintf("Render error: %v", err))
		return err
	}

	// 4. Send
	if err := s.provider.SendEmail([]string{recipient}, tmpl.Subject, body); err != nil {
		s.failLog(reqLog, fmt.Sprintf("Provider error: %v", err))
		return err
	}

	// 5. Update Log (Sent)
	now := time.Now()
	reqLog.Status = core.StatusSent
	reqLog.SentAt = &now
	s.repo.UpdateRequestLog(reqLog)

	return nil
}

func (s *EmailService) failLog(reqLog *core.EmailRequestLog, msg string) {
	reqLog.Status = core.StatusFailed
	reqLog.ErrorMessage = &msg
	s.repo.UpdateRequestLog(reqLog)
}

func (s *EmailService) SendRaw(to, subject, body string) error {
	log.Printf("[Email] Attempting to send email to: %s, subject: %s", to, subject)
	err := s.provider.SendEmail([]string{to}, subject, body)
	if err != nil {
		log.Printf("[Email] Failed to send email: %v", err)
		return err
	}
	log.Printf("[Email] Successfully sent email to: %s", to)
	return nil
}

func (s *EmailService) GetLogs() ([]core.EmailRequestLog, error) {
	return s.repo.GetEmailLogs()
}
