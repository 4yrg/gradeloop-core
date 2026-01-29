package core

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Enums
type UserType string

const (
	UserTypeStudent        UserType = "STUDENT"
	UserTypeInstructor     UserType = "INSTRUCTOR"
	UserTypeInstituteAdmin UserType = "INSTITUTE_ADMIN"
	UserTypeSystemAdmin    UserType = "SYSTEM_ADMIN"
)

// User Entity
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	FullName     string    `gorm:"not null"`
	UserType     UserType  `gorm:"type:text;not null"` // Explicit type for SQLite compatibility
	IsActive     bool      `gorm:"default:true"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`

	// Associations - Pointers to allow nil (0 or 1 relationship)
	StudentProfile        *StudentProfile        `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	InstructorProfile     *InstructorProfile     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	InstituteAdminProfile *InstituteAdminProfile `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}

// -- Profiles --

type StudentProfile struct {
	UserID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	EnrollmentNumber string    `gorm:"uniqueIndex"`
	EnrollmentYear   int

	// Relationships
	ClassEnrollments []ClassEnrollment `gorm:"foreignKey:StudentID"`
}

type InstructorProfile struct {
	UserID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	EmployeeID     string    `gorm:"uniqueIndex"`
	Specialization string
}

type InstituteAdminProfile struct {
	UserID      uuid.UUID `gorm:"type:uuid;primaryKey"`
	InstituteID uuid.UUID `gorm:"type:uuid;not null"`
}

// -- Organizational Structure --

type Institute struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name      string    `gorm:"not null"`
	Code      string    `gorm:"uniqueIndex;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time

	Faculties []Faculty `gorm:"foreignKey:InstituteID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (i *Institute) BeforeCreate(tx *gorm.DB) (err error) {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return
}

type Faculty struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	InstituteID uuid.UUID `gorm:"type:uuid;not null"`
	Name        string    `gorm:"not null"`
	CreatedAt   time.Time

	Departments []Department `gorm:"foreignKey:FacultyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (f *Faculty) BeforeCreate(tx *gorm.DB) (err error) {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return
}

type Department struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	FacultyID uuid.UUID `gorm:"type:uuid;not null"`
	Name      string    `gorm:"not null"`
	CreatedAt time.Time

	Classes []Class `gorm:"foreignKey:DepartmentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (d *Department) BeforeCreate(tx *gorm.DB) (err error) {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return
}

type Class struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	DepartmentID uuid.UUID `gorm:"type:uuid;not null"`
	Name         string    `gorm:"not null"`
	CreatedAt    time.Time

	Enrollments []ClassEnrollment `gorm:"foreignKey:ClassID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (c *Class) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

// -- Memberships --

type ClassEnrollment struct {
	StudentID  uuid.UUID `gorm:"type:uuid;primaryKey"` // Composite PK part 1
	ClassID    uuid.UUID `gorm:"type:uuid;primaryKey"` // Composite PK part 2
	EnrolledAt time.Time
}
