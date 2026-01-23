package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// FlexibleTime handles various time formats in JSON
type FlexibleTime time.Time

// UnmarshalJSON implements custom JSON unmarshaling for FlexibleTime
func (ft *FlexibleTime) UnmarshalJSON(data []byte) error {
	s := strings.Trim(string(data), "\"")
	if s == "null" || s == "" {
		return nil
	}

	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	var t time.Time
	var err error
	for _, format := range formats {
		t, err = time.Parse(format, s)
		if err == nil {
			*ft = FlexibleTime(t)
			return nil
		}
	}

	return fmt.Errorf("cannot parse %q as any of the supported time formats", s)
}

// MarshalJSON implements custom JSON marshaling for FlexibleTime
func (ft FlexibleTime) MarshalJSON() ([]byte, error) {
	return json.Marshal(time.Time(ft).Format(time.RFC3339))
}

// Scan implements the Scanner interface for GORM
func (ft *FlexibleTime) Scan(value interface{}) error {
	if value == nil {
		*ft = FlexibleTime(time.Time{})
		return nil
	}
	t, ok := value.(time.Time)
	if !ok {
		return fmt.Errorf("failed to scan FlexibleTime: expected time.Time, got %T", value)
	}
	*ft = FlexibleTime(t)
	return nil
}

// Value implements the driver Valuer interface for GORM
func (ft FlexibleTime) Value() (driver.Value, error) {
	return time.Time(ft), nil
}

// Time returns the underlying time.Time
func (ft FlexibleTime) Time() time.Time {
	return time.Time(ft)
}
