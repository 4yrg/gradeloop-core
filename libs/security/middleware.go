package security

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const (
	ServiceClaimsContextKey contextKey = "service_claims"
)

// ServiceAuthMiddleware returns a middleware that verifies service tokens
func ServiceAuthMiddleware(verifier *TokenVerifier) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "authorization header required", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]
			claims, err := verifier.Verify(tokenString)
			if err != nil {
				http.Error(w, "invalid token: "+err.Error(), http.StatusUnauthorized)
				return
			}

			// Add claims to context
			ctx := context.WithValue(r.Context(), ServiceClaimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireScope creates a middleware that checks for a specific scope
func RequireScope(scope string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(ServiceClaimsContextKey).(*ServiceClaims)
			if !ok {
				http.Error(w, "unauthorized: no service claims found", http.StatusUnauthorized)
				return
			}

			hasScope := false
			for _, s := range claims.Scopes {
				if s == scope {
					hasScope = true
					break
				}
			}

			if !hasScope {
				http.Error(w, "forbidden: missing scope "+scope, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
