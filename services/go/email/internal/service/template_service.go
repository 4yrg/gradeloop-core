package service

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"os"
	"path/filepath"
	"regexp"

	"github.com/4yrg/gradeloop-core/services/go/email/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/email/internal/repository"
)

type TemplateService struct {
	repo *repository.Repository
}

func NewTemplateService(repo *repository.Repository) *TemplateService {
	return &TemplateService{repo: repo}
}

func (s *TemplateService) GetTemplate(name string) (*core.EmailTemplate, error) {
	// 1. Try DB
	tmpl, err := s.repo.GetTemplateByName(name)
	if err == nil {
		return tmpl, nil
	}

	// 2. Fallback to Filesystem (for dev/init)
	log.Printf("Template '%s' not found in DB, checking filesystem...", name)

	// Assuming templates are stored in "templates/" directory relative to working dir
	path := filepath.Join("templates", name+".html")
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("template not found in DB or FS: %s", name)
	}

	// Extract Subject from <title>
	subject := "Subject Placeholder"
	if matches := regexp.MustCompile(`<title>(.*?)</title>`).FindSubmatch(content); len(matches) > 1 {
		subject = string(matches[1])
	}

	newTmpl := &core.EmailTemplate{
		Name:     name,
		Subject:  subject,
		HTMLBody: string(content),
	}

	// 3. Auto-seed to DB
	if err := s.repo.CreateTemplate(newTmpl); err != nil {
		fmt.Printf("Failed to seed template %s: %v\n", name, err)
		// Proceed returning the FS template even if save failed
	}

	return newTmpl, nil
}

func (s *TemplateService) Render(tmpl *core.EmailTemplate, data map[string]interface{}) (string, error) {
	t, err := template.New(tmpl.Name).Parse(tmpl.HTMLBody)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

func (s *TemplateService) ListTemplates() ([]core.EmailTemplate, error) {
	return s.repo.ListTemplates()
}

func (s *TemplateService) CreateTemplate(name, subject, htmlBody string) error {
	template := &core.EmailTemplate{
		Name:     name,
		Subject:  subject,
		HTMLBody: htmlBody,
	}
	return s.repo.CreateTemplate(template)
}
