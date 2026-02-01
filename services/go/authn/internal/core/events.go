package core

type EventType string

const (
	EventMagicLinkRequested EventType = "MagicLinkRequested"
	EventEmailConfirmed     EventType = "EmailConfirmed"
	EventLoginSuccess       EventType = "LoginSuccess"
	EventLoginFailed        EventType = "LoginFailed"
)

type AuthEvent struct {
	Type      EventType `json:"type"`
	Timestamp int64     `json:"timestamp"`
	UserID    string    `json:"user_id,omitempty"`
	Email     string    `json:"email,omitempty"`
	Details   string    `json:"details,omitempty"`
}
