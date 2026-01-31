package api

import (
	"time"

	"github.com/4yrg/gradeloop-core/services/go/session/internal/core"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	useCase core.SessionUseCase
}

func NewHandler(useCase core.SessionUseCase) *Handler {
	return &Handler{useCase: useCase}
}

type CreateSessionRequest struct {
	UserID    string `json:"user_id"`
	UserRole  string `json:"user_role"`
	UserAgent string `json:"user_agent"`
	ClientIP  string `json:"client_ip"`
}

type CreateSessionResponse struct {
	SessionID    string `json:"session_id"`
	RefreshToken string `json:"refresh_token"`
}

func (h *Handler) CreateSession(c *fiber.Ctx) error {
	var req CreateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	session, rawToken, err := h.useCase.CreateSession(c.Context(), req.UserID, req.UserRole, req.ClientIP, req.UserAgent)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(CreateSessionResponse{
		SessionID:    session.ID.String(),
		RefreshToken: rawToken,
	})
}

type ValidateSessionRequest struct {
	SessionID string `json:"session_id"`
}

type SessionResponse struct {
	ID              string     `json:"id"`
	UserID          string     `json:"user_id"`
	UserRole        string     `json:"user_role"`
	UserAgent       string     `json:"user_agent"`
	ClientIP        string     `json:"client_ip"`
	RotationCounter int        `json:"rotation_counter"`
	CreatedAt       time.Time  `json:"created_at"`
	ExpiresAt       time.Time  `json:"expires_at"`
	RevokedAt       *time.Time `json:"revoked_at,omitempty"`
}

func (h *Handler) ValidateSession(c *fiber.Ctx) error {
	var req ValidateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	id, err := uuid.Parse(req.SessionID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid session id"})
	}

	session, err := h.useCase.ValidateSession(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(SessionResponse{
		ID:              session.ID.String(),
		UserID:          session.UserID,
		UserRole:        session.UserRole,
		UserAgent:       session.UserAgent,
		ClientIP:        session.ClientIP,
		RotationCounter: session.RotationCounter,
		CreatedAt:       session.CreatedAt,
		ExpiresAt:       session.ExpiresAt,
		RevokedAt:       session.RevokedAt,
	})
}

func (h *Handler) GetSession(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid session id"})
	}

	session, err := h.useCase.GetSession(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "session not found"})
	}

	return c.JSON(SessionResponse{
		ID:              session.ID.String(),
		UserID:          session.UserID,
		UserRole:        session.UserRole,
		UserAgent:       session.UserAgent,
		ClientIP:        session.ClientIP,
		RotationCounter: session.RotationCounter,
		CreatedAt:       session.CreatedAt,
		ExpiresAt:       session.ExpiresAt,
		RevokedAt:       session.RevokedAt,
	})
}

type RefreshSessionRequest struct {
	SessionID    string `json:"session_id"`
	RefreshToken string `json:"refresh_token"`
}

type RefreshSessionResponse struct {
	SessionID       string `json:"session_id"`
	NewRefreshToken string `json:"new_refresh_token"`
}

func (h *Handler) RefreshSession(c *fiber.Ctx) error {
	var req RefreshSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	id, err := uuid.Parse(req.SessionID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid session id"})
	}

	session, newRawToken, err := h.useCase.RefreshSession(c.Context(), id, req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(RefreshSessionResponse{
		SessionID:       session.ID.String(),
		NewRefreshToken: newRawToken,
	})
}

func (h *Handler) RevokeSession(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid session id"})
	}

	if err := h.useCase.RevokeSession(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *Handler) RevokeUserSessions(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user id required"})
	}

	if err := h.useCase.RevokeAllUserSessions(c.Context(), userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusOK)
}
