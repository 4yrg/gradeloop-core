package models

import "errors"

var (
	ErrInvalidSession = errors.New("invalid session")
	ErrSessionRevoked = errors.New("session revoked")
	ErrSessionExpired = errors.New("session expired")
	ErrInvalidToken   = errors.New("invalid refresh token")
)
