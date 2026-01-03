package main

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"github.com/gradeloop/auth-service/internal/models"
)

func seedUsers(db *gorm.DB) {
	users := []models.User{
		{
			Email:        "admin@gradeloop.com",
			PasswordHash: "password123",
			Role:         models.RoleSystemAdmin,
		},
		{
			Email:        "institute@gradeloop.com",
			PasswordHash: "password123",
			Role:         models.RoleInstituteAdmin,
		},
		{
			Email:        "instructor@gradeloop.com",
			PasswordHash: "password123",
			Role:         models.RoleInstructor,
		},
		{
			Email:        "student@gradeloop.com",
			PasswordHash: "password123",
			Role:         models.RoleStudent,
		},
	}

	for _, u := range users {
		var existingUser models.User
		if err := db.Where("email = ?", u.Email).First(&existingUser).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(u.PasswordHash), bcrypt.DefaultCost)
				u.PasswordHash = string(hashedPassword)
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
