package handlers

import (
	"net/http"

	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/store"
	"github.com/gin-gonic/gin"
)

type TemplateHandler struct {
	store *store.Store
}

func NewTemplateHandler(s *store.Store) *TemplateHandler {
	return &TemplateHandler{store: s}
}

func (h *TemplateHandler) CreateTemplate(c *gin.Context) {
	var t models.EmailTemplate
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.store.CreateTemplate(&t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, t)
}

func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	slug := c.Param("slug")
	t, err := h.store.GetTemplateBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(http.StatusOK, t)
}

func (h *TemplateHandler) UpdateTemplate(c *gin.Context) {
	slug := c.Param("slug")
	t, err := h.store.GetTemplateBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.store.UpdateTemplate(t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, t)
}

func (h *TemplateHandler) DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	if err := h.store.DeleteTemplate(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	ts, err := h.store.ListTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ts)
}
