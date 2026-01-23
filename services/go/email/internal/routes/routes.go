package routes

import (
	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/handlers"
	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/service"
	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/store"
	"github.com/gin-gonic/gin"
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
