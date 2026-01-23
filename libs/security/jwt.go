package security

import (
	"github.com/golang-jwt/jwt/v5"
)

// ServiceClaims defines the standard claims for service-to-service communication
type ServiceClaims struct {
	ServiceName string   `json:"service_name"`
	Role        string   `json:"role"`
	Scopes      []string `json:"scopes"`
	jwt.RegisteredClaims
}
