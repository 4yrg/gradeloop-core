package main

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
    "github.com/gradeloop/auth-service/internal/domain/user"
)

func seedUsers(db *gorm.DB) {
	users := []user.User{
		{
			Email:     "admin@gradeloop.com",
			Password:  "password123",
			Role:      "system_admin",
			FirstName: "System",
			LastName:  "Admin",
		},
		{
			Email:     "institute@gradeloop.com",
			Password:  "password123",
			Role:      "institute_admin",
			FirstName: "Institute",
			LastName:  "Admin",
		},
		{
			Email:     "instructor@gradeloop.com",
			Password:  "password123",
			Role:      "instructor",
			FirstName: "Jane",
			LastName:  "Doe",
		},
		{
			Email:     "student@gradeloop.com",
			Password:  "password123",
			Role:      "student",
			FirstName: "John",
			LastName:  "Smith",
		},
	}

	for _, u := range users {
		var existingUser user.User
		if err := db.Where("email = ?", u.Email).First(&existingUser).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
				u.Password = string(hashedPassword)
				if err := db.Create(&u).Error; err != nil {
					log.Printf("Failed to seed user %s: %v", u.Email, err)
				} else {
					log.Printf("Seeded user: %s", u.Email)
				}
			} else {
				log.Printf("Error checking user %s: %v", u.Email, err)
			}
		} else {
			log.Printf("User %s already exists, skipping seed", u.Email)
		}
	}
}
