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
	ID                     uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Email                  string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash           string         `gorm:"not null" json:"-"`
	FullName               string         `gorm:"not null" json:"full_name"`
	UserType               UserType       `gorm:"type:text;not null" json:"user_type"` // Explicit type for SQLite compatibility
	IsActive               bool           `gorm:"default:true" json:"is_active"`
	RequiresPasswordChange bool           `gorm:"default:false" json:"requires_password_change"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations - Pointers to allow nil (0 or 1 relationship)
	StudentProfile        *StudentProfile        `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"student_profile,omitempty"`
	InstructorProfile     *InstructorProfile     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"instructor_profile,omitempty"`
	InstituteAdminProfile *InstituteAdminProfile `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institute_admin_profile,omitempty"`
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
	InstituteID uuid.UUID `gorm:"type:uuid;primaryKey"`
}

// -- Organizational Structure --

type Institute struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Code         string    `gorm:"uniqueIndex;not null" json:"code"`
	Domain       string    `gorm:"uniqueIndex;not null" json:"domain"`
	ContactEmail string    `gorm:"not null" json:"contact_email"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Faculties []Faculty `gorm:"foreignKey:InstituteID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"faculties,omitempty"`
}

func (i *Institute) BeforeCreate(tx *gorm.DB) (err error) {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return
}

type Faculty struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	InstituteID uuid.UUID `gorm:"type:uuid;not null" json:"institute_id"`
	Name        string    `gorm:"not null" json:"name"`
	CreatedAt   time.Time `json:"created_at"`

	Departments []Department `gorm:"foreignKey:FacultyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"departments,omitempty"`
}

func (f *Faculty) BeforeCreate(tx *gorm.DB) (err error) {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return
}

type Department struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	FacultyID uuid.UUID `gorm:"type:uuid;not null" json:"faculty_id"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`

	Classes []Class `gorm:"foreignKey:DepartmentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"classes,omitempty"`
}

func (d *Department) BeforeCreate(tx *gorm.DB) (err error) {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return
}

type Class struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	DepartmentID uuid.UUID `gorm:"type:uuid;not null" json:"department_id"`
	Name         string    `gorm:"not null" json:"name"`
	CreatedAt    time.Time `json:"created_at"`

	Enrollments []ClassEnrollment `gorm:"foreignKey:ClassID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"enrollments,omitempty"`
}

func (c *Class) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

// -- Memberships --

type ClassEnrollment struct {
	StudentID  uuid.UUID `gorm:"type:uuid;primaryKey" json:"student_id"` // Composite PK part 1
	ClassID    uuid.UUID `gorm:"type:uuid;primaryKey" json:"class_id"`   // Composite PK part 2
	EnrolledAt time.Time `json:"enrolled_at"`

	Student *User `gorm:"foreignKey:StudentID" json:"student,omitempty"`
}
