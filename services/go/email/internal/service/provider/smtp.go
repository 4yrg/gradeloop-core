package provider

import (
	"fmt"
	"net/smtp"
	"strings"

	"github.com/4yrg/gradeloop-core/services/go/email/internal/core"
)

type SMTPProvider struct {
	config *core.Config
	auth   smtp.Auth
}

func NewSMTPProvider(cfg *core.Config) *SMTPProvider {
	// Sanitize password: remove spaces (common in App Passwords) and quotes
	cleanPass := strings.ReplaceAll(cfg.SMTPPassword, " ", "")
	cleanPass = strings.ReplaceAll(cleanPass, "\"", "")
	cleanPass = strings.ReplaceAll(cleanPass, "'", "")

	auth := smtp.PlainAuth("", cfg.SMTPUsername, cleanPass, cfg.SMTPHost)
	return &SMTPProvider{
		config: cfg,
		auth:   auth,
	}
}

func (p *SMTPProvider) SendEmail(to []string, subject string, body string) error {
	addr := fmt.Sprintf("%s:%d", p.config.SMTPHost, p.config.SMTPPort)

	contentType := "text/html; charset=\"UTF-8\""

	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: %s\r\n"+
		"\r\n"+
		"%s\r\n", to[0], subject, contentType, body))

	if p.config.SMTPUsername == "" {
		// If auth is not provided we might want to skip authentication
		// However, for most production SMTP servers auth is required.
		// If testing locally with Mailhog/Mailpit, auth might be nil.
		// For now keeping consistent behavior with previous valid auth requirement.
	}

	err := smtp.SendMail(addr, p.auth, p.config.SMTPFrom, to, msg)
	if err != nil {
		return fmt.Errorf("failed to send email via SMTP: %w", err)
	}

	return nil
}
