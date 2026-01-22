package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/gradeloop/email-service/internal/handlers"
	"github.com/gradeloop/email-service/internal/service"
	"github.com/gradeloop/email-service/internal/store"
)

func SetupRouter(s *store.Store, es *service.EmailService) *gin.Engine {
	r := gin.Default()

	templateHandler := handlers.NewTemplateHandler(s)
	emailHandler := handlers.NewEmailHandler(es)

	v1 := r.Group("/api/v1")
	{
		templates := v1.Group("/templates")
		{
			templates.POST("", templateHandler.CreateTemplate)
			templates.GET("", templateHandler.ListTemplates)
			templates.GET("/:slug", templateHandler.GetTemplate)
			templates.PUT("/:slug", templateHandler.UpdateTemplate)
			templates.DELETE("/:id", templateHandler.DeleteTemplate)
		}

		emails := v1.Group("/emails")
		{
			emails.POST("/send", emailHandler.SendEmail)
		}
	}

	return r
}
