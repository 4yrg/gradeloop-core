package core

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AssignmentType string

const (
	AssignmentTypeLab  AssignmentType = "Lab"
	AssignmentTypeExam AssignmentType = "Exam"
	AssignmentTypeDemo AssignmentType = "Demo"
)

type GradingMethod string

const (
	GradingMethodAuto   GradingMethod = "Auto"
	GradingMethodManual GradingMethod = "Manual"
	GradingMethodHybrid GradingMethod = "Hybrid"
)

type Difficulty string

const (
	DifficultyEasy   Difficulty = "Easy"
	DifficultyMedium Difficulty = "Medium"
	DifficultyHard   Difficulty = "Hard"
)

type Assignment struct {
	ID                     uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CourseID               string         `gorm:"index" json:"courseId"`
	Title                  string         `gorm:"not null" json:"title"`
	Type                   AssignmentType `json:"type"`
	Difficulty             Difficulty     `json:"difficulty"`
	ProblemStatement       string         `gorm:"type:text" json:"problemStatement"`
	ReleaseDate            time.Time      `json:"releaseDate"`
	DueDate                time.Time      `json:"dueDate"`
	AllowLateSubmissions   bool           `json:"allowLateSubmissions"`
	LateDueDate            *time.Time     `json:"lateDueDate,omitempty"`
	LatePolicy             string         `json:"latePolicy"`
	TotalScore             int            `json:"totalScore"`
	AutograderPoints       int            `json:"autograderPoints"`
	AllowManualGrading     bool           `json:"allowManualGrading"`
	GradingMethod          GradingMethod  `json:"gradingMethod"`
	TimeLimit              int            `json:"timeLimit"`   // in seconds or minutes (as per UI)
	MemoryLimit            string         `json:"memoryLimit"` // e.g., "256MB"
	TotalAttempts          int            `json:"totalAttempts"`
	EnforceTimeLimit       bool           `json:"enforceTimeLimit"`
	EnableGroupSubmissions bool           `json:"enableGroupSubmissions"`
	GroupSizeLimit         int            `json:"groupSizeLimit"`
	EnableLeaderboard      bool           `json:"enableLeaderboard"`
	VivaEnabled            bool           `json:"vivaEnabled"`
	VivaRequired           bool           `json:"vivaRequired"`
	VivaWeight             int            `json:"vivaWeight"` // percentage 0-100
	EnableAiAssistance     bool           `json:"enableAiAssistance"`
	CreatedAt              time.Time      `json:"createdAt"`
	UpdatedAt              time.Time      `json:"updatedAt"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`

	Rubric      []RubricItem           `gorm:"foreignKey:AssignmentID" json:"rubric"`
	Constraints []AssignmentConstraint `gorm:"foreignKey:AssignmentID" json:"constraints"`
	Languages   []AssignmentLanguage   `gorm:"foreignKey:AssignmentID" json:"allowedLanguages"`
}

type RubricItem struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AssignmentID uuid.UUID `gorm:"index" json:"assignmentId"`
	Criterion    string    `json:"criterion"`
	Points       int       `json:"points"`
}

type AssignmentConstraint struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AssignmentID uuid.UUID `gorm:"index" json:"assignmentId"`
	Content      string    `json:"content"`
}

type AssignmentLanguage struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AssignmentID uuid.UUID `gorm:"index" json:"assignmentId"`
	Language     string    `json:"language"`
}
