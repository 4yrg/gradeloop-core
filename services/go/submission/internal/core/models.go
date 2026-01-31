package core

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubmissionStatus string

const (
	SubmissionStatusAccepted            SubmissionStatus = "accepted"
	SubmissionStatusWrongAnswer         SubmissionStatus = "wrong_answer"
	SubmissionStatusTimeLimitExceeded   SubmissionStatus = "time_limit_exceeded"
	SubmissionStatusMemoryLimitExceeded SubmissionStatus = "memory_limit_exceeded"
	SubmissionStatusRuntimeError        SubmissionStatus = "runtime_error"
	SubmissionStatusCompilationError    SubmissionStatus = "compilation_error"
	SubmissionStatusPending             SubmissionStatus = "pending"
)

type Submission struct {
	ID                 uuid.UUID        `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AssignmentID       uuid.UUID        `gorm:"index" json:"assignmentId"`
	StudentID          string           `gorm:"index" json:"studentId"`
	Timestamp          time.Time        `json:"timestamp"`
	Status             SubmissionStatus `json:"status"`
	Score              int              `json:"score"`
	TotalScore         int              `json:"totalScore"`
	Language           string           `json:"language"`
	Runtime            string           `json:"runtime"`
	Memory             string           `json:"memory"`
	TestCasesPassed    int              `json:"testCasesPassed"`
	TotalTestCases     int              `json:"totalTestCases"`
	ExecutionLogs      string           `gorm:"type:text" json:"executionLogs"`
	VivaPerformance    string           `json:"vivaPerformance"`
	VivaConfidence     string           `json:"vivaConfidence"`
	AiVerdict          string           `gorm:"type:text" json:"aiVerdict"`
	AiLikelihood       float64          `json:"aiLikelihood"`
	CloneSimilarity    float64          `json:"cloneSimilarity"`
	AuthFingerprint    string           `json:"authFingerprint"`
	KeystrokeAnalytics string           `gorm:"type:text" json:"keystrokeAnalytics"` // Store as JSON string for now
	CreatedAt          time.Time        `json:"createdAt"`
	UpdatedAt          time.Time        `json:"updatedAt"`
	DeletedAt          gorm.DeletedAt   `gorm:"index" json:"-"`

	Files     []SubmissionFile     `gorm:"foreignKey:SubmissionID" json:"files"`
	VivaTurns []VivaTranscriptTurn `gorm:"foreignKey:SubmissionID" json:"vivaTranscript"`
	Integrity []IntegritySignal    `gorm:"foreignKey:SubmissionID" json:"integritySignals"`
}

type SubmissionFile struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	SubmissionID uuid.UUID `gorm:"index" json:"submissionId"`
	Filename     string    `json:"filename"`
	Content      string    `gorm:"type:text" json:"content"`
}

type VivaTranscriptTurn struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	SubmissionID uuid.UUID `gorm:"index" json:"submissionId"`
	Speaker      string    `json:"speaker"` // AI or STUDENT
	Text         string    `gorm:"type:text" json:"text"`
	Confidence   float64   `json:"confidence"`
	Status       string    `json:"status"` // correct, partial, etc.
}

type IntegritySignal struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	SubmissionID uuid.UUID `gorm:"index" json:"submissionId"`
	Label        string    `json:"label"`  // e.g., "Abnormal Paste"
	Status       string    `json:"status"` // Clean, Flagged
	Detail       string    `json:"detail"`
}
