package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role represents a user role within a tenant.
type Role struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string         `gorm:"index;not null" json:"name"`
	Description string         `json:"description"`
	TenantID    string         `gorm:"index" json:"tenant_id"`
	Permissions []Permission   `gorm:"many2many:role_permissions;" json:"permissions"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// Permission represents a specific action that can be performed on a resource type.
type Permission struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string    `gorm:"uniqueIndex;not null" json:"name"`
	Action       string    `gorm:"not null" json:"action"`        // e.g., READ, WRITE, DELETE
	ResourceType string    `gorm:"not null" json:"resource_type"` // e.g., COURSES, USERS
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Policy represents a fine-grained authorization rule (RBAC + ABAC).
type Policy struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SubjectID   string    `gorm:"index;not null" json:"subject_id"`   // User ID or Role ID
	SubjectType string    `gorm:"index;not null" json:"subject_type"` // USER or ROLE
	Effect      string    `gorm:"not null" json:"effect"`             // ALLOW or DENY
	Action      string    `gorm:"index;not null" json:"action"`
	Resource    string    `gorm:"index;not null" json:"resource"`
	Conditions  string    `gorm:"type:text" json:"conditions"` // ABAC conditions (JSON)
	TenantID    string    `gorm:"index" json:"tenant_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AuditLog records every authorization check result.
type AuditLog struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        string    `gorm:"index" json:"user_id"`
	Resource      string    `gorm:"index" json:"resource"`
	Action        string    `gorm:"index" json:"action"`
	Result        string    `gorm:"index" json:"result"` // ALLOWED or DENIED
	Metadata      string    `gorm:"type:text" json:"metadata"`
	ServiceOrigin string    `json:"service_origin"`
	Timestamp     time.Time `gorm:"index" json:"timestamp"`
}

func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (p *Policy) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	if a.Timestamp.IsZero() {
		a.Timestamp = time.Now()
	}
	return nil
}
