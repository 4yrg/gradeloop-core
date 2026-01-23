package security

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenSigner struct {
	privateKey any
	issuer     string
}

func NewTokenSigner(privateKey any, issuer string) *TokenSigner {
	return &TokenSigner{
		privateKey: privateKey,
		issuer:     issuer,
	}
}

func (s *TokenSigner) SignServiceToken(serviceName, role string, scopes []string, duration time.Duration) (string, error) {
	claims := ServiceClaims{
		ServiceName: serviceName,
		Role:        role,
		Scopes:      scopes,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   serviceName,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	return token.SignedString(s.privateKey)
}
