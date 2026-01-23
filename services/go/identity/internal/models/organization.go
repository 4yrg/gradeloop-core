package models

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Institute represents an educational institution
type Institute struct {
	ID          string         `gorm:"primarykey" json:"id"`
	Name        string         `gorm:"not null" json:"name" validate:"required"`
	Code        string         `gorm:"uniqueIndex;not null" json:"code" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   FlexibleTime   `json:"created_at"`
	UpdatedAt   FlexibleTime   `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Faculties []Faculty `gorm:"foreignKey:InstituteID;constraint:OnDelete:CASCADE" json:"faculties,omitempty"`
}

func (i *Institute) BeforeCreate(tx *gorm.DB) (err error) {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return
}

// Faculty represents a faculty within an institute
type Faculty struct {
	ID          string         `gorm:"primarykey" json:"id"`
	InstituteID string         `gorm:"not null;index" json:"institute_id" validate:"required"`
	Name        string         `gorm:"not null" json:"name" validate:"required"`
	Code        string         `gorm:"not null" json:"code" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   FlexibleTime   `json:"created_at"`
	UpdatedAt   FlexibleTime   `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Institute   *Institute   `gorm:"foreignKey:InstituteID" json:"institute,omitempty"`
	Departments []Department `gorm:"foreignKey:FacultyID;constraint:OnDelete:CASCADE" json:"departments,omitempty"`
}

func (f *Faculty) BeforeCreate(tx *gorm.DB) (err error) {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	return
}

// Department represents a department within a faculty
type Department struct {
	ID          string         `gorm:"primarykey" json:"id"`
	FacultyID   string         `gorm:"not null;index" json:"faculty_id" validate:"required"`
	Name        string         `gorm:"not null" json:"name" validate:"required"`
	Code        string         `gorm:"not null" json:"code" validate:"required"`
	Description string         `json:"description"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   FlexibleTime   `json:"created_at"`
	UpdatedAt   FlexibleTime   `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Faculty *Faculty `gorm:"foreignKey:FacultyID" json:"faculty,omitempty"`
	Classes []Class  `gorm:"foreignKey:DepartmentID;constraint:OnDelete:CASCADE" json:"classes,omitempty"`
}

func (d *Department) BeforeCreate(tx *gorm.DB) (err error) {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return
}

// Class represents a class within a department
type Class struct {
	ID           string         `gorm:"primarykey" json:"id"`
	DepartmentID string         `gorm:"not null;index" json:"department_id" validate:"required"`
	Name         string         `gorm:"not null" json:"name" validate:"required"`
	Code         string         `gorm:"not null" json:"code" validate:"required"`
	Year         int            `gorm:"not null" json:"-" validate:"omitempty,min=1,max=10"`
	Semester     int            `gorm:"not null" json:"-" validate:"omitempty,min=1,max=4"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    FlexibleTime   `json:"created_at"`
	UpdatedAt    FlexibleTime   `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Department *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
}

func (c *Class) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return
}

// FlexibleInt is a custom type that can unmarshal from both string and int
type FlexibleInt int

// UnmarshalJSON implements custom JSON unmarshaling for FlexibleInt
func (fi *FlexibleInt) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as int first
	var i int
	if err := json.Unmarshal(data, &i); err == nil {
		*fi = FlexibleInt(i)
		return nil
	}

	// Try to unmarshal as string
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("semester/year must be a number or string representation of a number")
	}

	// Semantic mapping for semester/year
	lowerS := strings.ToLower(s)
	switch lowerS {
	case "spring", "first", "1st":
		*fi = 1
		return nil
	case "fall", "second", "2nd":
		*fi = 2
		return nil
	case "summer", "third", "3rd":
		*fi = 3
		return nil
	case "winter", "fourth", "4th":
		*fi = 4
		return nil
	}

	// Convert string to int
	parsed, err := strconv.Atoi(s)
	if err != nil {
		return fmt.Errorf("invalid number format for semester/year: %s", s)
	}

	*fi = FlexibleInt(parsed)
	return nil
}

// MarshalJSON implements custom JSON marshaling for FlexibleInt
func (fi FlexibleInt) MarshalJSON() ([]byte, error) {
	return json.Marshal(int(fi))
}

// classJSON is a helper struct for JSON unmarshaling
type classJSON struct {
	ID           string      `json:"id"`
	DepartmentID string      `json:"department_id"`
	Name         string      `json:"name"`
	Code         string      `json:"code"`
	Year         FlexibleInt `json:"year"`
	Semester     FlexibleInt `json:"semester"`
	IsActive     *bool       `json:"is_active,omitempty"`
	Department   *Department `json:"department,omitempty"`
}

// UnmarshalJSON implements custom JSON unmarshaling for Class
func (c *Class) UnmarshalJSON(data []byte) error {
	var helper classJSON
	if err := json.Unmarshal(data, &helper); err != nil {
		return err
	}

	c.ID = helper.ID
	c.DepartmentID = helper.DepartmentID
	c.Name = helper.Name
	c.Code = helper.Code
	c.Year = int(helper.Year)
	c.Semester = int(helper.Semester)
	if helper.IsActive != nil {
		c.IsActive = *helper.IsActive
	}
	c.Department = helper.Department

	return nil
}

// MarshalJSON implements custom JSON marshaling for Class
func (c Class) MarshalJSON() ([]byte, error) {
	type Alias Class
	return json.Marshal(&struct {
		Year     int `json:"year"`
		Semester int `json:"semester"`
		*Alias
	}{
		Year:     c.Year,
		Semester: c.Semester,
		Alias:    (*Alias)(&c),
	})
}
