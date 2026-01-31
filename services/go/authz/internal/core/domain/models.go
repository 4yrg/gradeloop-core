package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Scope string

const (
	ScopeSystem    Scope = "system"
	ScopeInstitute Scope = "institute"
)

type Role struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;" json:"id"`
	Name        string         `gorm:"uniqueIndex" json:"name"`
	Scope       Scope          `json:"scope"`
	Description string         `json:"description"`
	Permissions []Permission   `gorm:"many2many:role_permissions;" json:"permissions"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Permission struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	Name        string    `gorm:"uniqueIndex" json:"name"` // e.g., "user.create"
	Resource    string    `json:"resource"`                // e.g., "user"
	Action      string    `json:"action"`                  // e.g., "create"
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Policy struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	RoleID       uuid.UUID `gorm:"type:uuid;index" json:"role_id"`
	PermissionID uuid.UUID `gorm:"type:uuid;index" json:"permission_id"`
	Conditions   string    `gorm:"type:text" json:"conditions"` // JSON string for ABAC conditions
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;" json:"id"`
	Subject   string    `json:"subject"`  // Who (User ID or Service Name)
	Resource  string    `json:"resource"` // What resource
	Action    string    `json:"action"`   // What action
	Decision  string    `json:"decision"` // ALLOW or DENY
	Context   string    `json:"context"`  // JSON context
	Timestamp time.Time `json:"timestamp"`
}

// BeforeCreate hooks to set UUIDs
func (r *Role) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return
}

func (p *Permission) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}

func (p *Policy) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) (err error) {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return
}
