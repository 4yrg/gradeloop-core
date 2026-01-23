package handlers

import (
	"net/http"

	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/service"
	"github.com/gin-gonic/gin"
)

type EmailHandler struct {
	emailService *service.EmailService
}

func NewEmailHandler(es *service.EmailService) *EmailHandler {
	return &EmailHandler{emailService: es}
}

func (h *EmailHandler) SendEmail(c *gin.Context) {
	var req service.SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.emailService.QueueEmail(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Email queued successfully"})
}
