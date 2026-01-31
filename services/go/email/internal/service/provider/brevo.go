package provider

import (
	"fmt"
	"net/smtp"

	"github.com/4yrg/gradeloop-core/services/go/email/internal/core"
)

type BrevoProvider struct {
	config *core.Config
	auth   smtp.Auth
}

func NewBrevoProvider(cfg *core.Config) *BrevoProvider {
	auth := smtp.PlainAuth("", cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPHost)
	return &BrevoProvider{
		config: cfg,
		auth:   auth,
	}
}

func (p *BrevoProvider) SendEmail(to []string, subject string, body string) error {
	addr := fmt.Sprintf("%s:%d", p.config.SMTPHost, p.config.SMTPPort)

	msg := []byte("To: " + to[0] + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"\r\n" +
		body + "\r\n")

	if p.config.SMTPUsername == "" {
		// If auth is not provided (e.g. dev mock), just log or skip?
		// For now assuming we always have auth as per requirements
		// implementing unauthenticated send just in case?
		// smtp.SendMail requires auth if server requires it.
	}

	err := smtp.SendMail(addr, p.auth, p.config.SMTPFrom, to, msg)
	if err != nil {
		return fmt.Errorf("failed to send email via Brevo: %w", err)
	}

	return nil
}
