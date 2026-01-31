package service

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"

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
	// Assuming templates are stored in "templates/" directory relative to working dir
	path := filepath.Join("templates", name+".html")
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("template not found in DB or FS: %s", name)
	}

	return &core.EmailTemplate{
		Name:     name,
		Subject:  "Subject Placeholder", // FS templates might need frontmatter or separate file for subject
		HTMLBody: string(content),
	}, nil
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
