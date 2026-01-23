package security

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type TokenVerifier struct {
	publicKey any
	issuer    string
}

func NewTokenVerifier(publicKey any, issuer string) *TokenVerifier {
	return &TokenVerifier{
		publicKey: publicKey,
		issuer:    issuer,
	}
}

func (v *TokenVerifier) Verify(tokenString string) (*ServiceClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &ServiceClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return v.publicKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*ServiceClaims); ok && token.Valid {
		if claims.Issuer != v.issuer {
			return nil, fmt.Errorf("invalid issuer: expected %s, got %s", v.issuer, claims.Issuer)
		}
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
