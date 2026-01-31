package core

// EmailProvider defines the interface for sending raw emails
type EmailProvider interface {
	SendEmail(to []string, subject string, body string) error
}

// TemplateService defines the interface for managing email templates
type TemplateService interface {
	GetTemplate(name string) (*EmailTemplate, error)
	Render(template *EmailTemplate, data map[string]interface{}) (string, error)
}
