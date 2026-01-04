package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gradeloop/auth-service/database"
	"github.com/gradeloop/auth-service/handlers"
	"github.com/gradeloop/auth-service/middleware"
)

func main() {
	database.ConnectDB()

	app := fiber.New()

	app.Use(logger.New())
	app.Use(cors.New())

	api := app.Group("/auth")

	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/me", middleware.Protected(), handlers.Me)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Fatal(app.Listen(":" + port))
}
