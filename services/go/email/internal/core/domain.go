package core

import (
	"time"

	"gorm.io/gorm"
)

// EmailTemplate represents a stored HTML email template
type EmailTemplate struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"uniqueIndex;not null" json:"name"`
	Subject   string         `gorm:"not null" json:"subject"`
	HTMLBody  string         `gorm:"not null" json:"html_body"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// RequestStatus represents the status of an email request
type RequestStatus string

const (
	StatusPending RequestStatus = "pending"
	StatusSent    RequestStatus = "sent"
	StatusFailed  RequestStatus = "failed"
)

// EmailRequestLog logs every email attempt
type EmailRequestLog struct {
	ID             uint          `gorm:"primaryKey" json:"id"`
	TemplateName   string        `gorm:"index;not null" json:"template_name"`
	RecipientEmail string        `gorm:"index;not null" json:"recipient_email"`
	Payload        string        `json:"payload"` // JSON string of the data used for replacement
	Status         RequestStatus `gorm:"index;not null;default:'pending'" json:"status"`
	ErrorMessage   *string       `json:"error_message,omitempty"`
	CreatedAt      time.Time     `json:"created_at"`
	SentAt         *time.Time    `json:"sent_at,omitempty"`
}
