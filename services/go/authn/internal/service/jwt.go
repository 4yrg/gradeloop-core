package service

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenService struct {
	signingKey []byte
}

func NewTokenService() *TokenService {
	key := os.Getenv("JWT_SIGNING_KEY")
	if key == "" {
		key = "insecure-default-key-for-dev"
	}
	return &TokenService{
		signingKey: []byte(key),
	}
}

type UserClaims struct {
	UserID      string   `json:"sub"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	jwt.RegisteredClaims
}

func (s *TokenService) GenerateAccessToken(userID, role string, permissions []string) (string, error) {
	claims := UserClaims{
		UserID:      userID,
		Role:        role,
		Permissions: permissions,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "authn-service",
			Audience:  []string{"gradeloop-services"},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.signingKey)
}

func (s *TokenService) ValidateToken(tokenString string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		return s.signingKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*UserClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrTokenInvalidId
}
