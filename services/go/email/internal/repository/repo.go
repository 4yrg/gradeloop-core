package repository

import (
	"fmt"
	"log"

	"github.com/4yrg/gradeloop-core/services/go/email/internal/core"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(dbName string) (*Repository, error) {
	dbPath := fmt.Sprintf("%s.db", dbName)
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto Migrate
	err = db.AutoMigrate(&core.EmailTemplate{}, &core.EmailRequestLog{})
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Printf("Connected to SQLite database: %s", dbPath)
	return &Repository{db: db}, nil
}

// GetTemplateByName fetches a template by its name
func (r *Repository) GetTemplateByName(name string) (*core.EmailTemplate, error) {
	var tmpl core.EmailTemplate
	// Use Find to avoid GORM logger "record not found" error being printed
	result := r.db.Where("name = ?", name).Limit(1).Find(&tmpl)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &tmpl, nil
}

// CreateRequestLog creates a new email request log
func (r *Repository) CreateRequestLog(log *core.EmailRequestLog) error {
	return r.db.Create(log).Error
}

// UpdateRequestLog updates the status and other fields of an existing log
func (r *Repository) UpdateRequestLog(log *core.EmailRequestLog) error {
	return r.db.Save(log).Error
}

// ListTemplates returns all templates (for internal API)
func (r *Repository) ListTemplates() ([]core.EmailTemplate, error) {
	var templates []core.EmailTemplate
	if err := r.db.Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}

// CreateTemplate creates or updates an email template
func (r *Repository) CreateTemplate(tmpl *core.EmailTemplate) error {
	return r.db.Save(tmpl).Error
}
