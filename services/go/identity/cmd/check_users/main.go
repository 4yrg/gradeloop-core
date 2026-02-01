package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	Email string `json:"email"`
}

func main() {
	_ = godotenv.Load(".env", "../.env", "../../.env", "../../../.env", "../../../../.env", "../../../../../.env")

	dsn := os.Getenv("IDENTITY_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		log.Fatal("IDENTITY_DATABASE_URL not set")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var users []User
	if err := db.Table("users").Select("email").Find(&users).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Println("Registered Users:")
	for _, u := range users {
		fmt.Printf("- %s\n", u.Email)
	}
}
