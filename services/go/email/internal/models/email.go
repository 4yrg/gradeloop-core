package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EmailTemplate struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Slug         string         `gorm:"uniqueIndex;not null" json:"slug"`
	Subject      string         `gorm:"not null" json:"subject"`
	HTMLBody     string         `gorm:"type:text;not null" json:"html_body"`
	TextBody     string         `gorm:"type:text" json:"text_body"`
	Placeholders string         `json:"placeholders"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (e *EmailTemplate) BeforeCreate(tx *gorm.DB) (err error) {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return
}

type EmailStatus string

const (
	StatusPending  EmailStatus = "pending"
	StatusSent     EmailStatus = "sent"
	StatusFailed   EmailStatus = "failed"
	StatusRetrying EmailStatus = "retrying"
)

type EmailLog struct {
	ID         uuid.UUID     `gorm:"type:uuid;primary_key;" json:"id"`
	Recipient  string        `gorm:"not null" json:"recipient"`
	TemplateID uuid.UUID     `gorm:"type:uuid;not null" json:"template_id"`
	Template   EmailTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
	Status     EmailStatus   `gorm:"not null" json:"status"`
	Data       string        `gorm:"type:text" json:"data"`
	RetryCount int           `gorm:"default:0" json:"retry_count"`
	LastError  string        `json:"last_error"`
	SentAt     *time.Time    `json:"sent_at,omitempty"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
}

func (e *EmailLog) BeforeCreate(tx *gorm.DB) (err error) {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return
}
