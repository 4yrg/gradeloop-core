package main

import (
	"log"
	"os"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/repository"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Load Config
	dsn := os.Getenv("IDENTITY_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		log.Fatal("IDENTITY_DATABASE_URL or DATABASE_URL must be set")
	}

	email := os.Getenv("SYS_ADMIN_EMAIL")
	password := os.Getenv("SYS_ADMIN_PW")

	if email == "" || password == "" {
		log.Fatal("SYS_ADMIN_EMAIL and SYS_ADMIN_PW must be set")
	}

	// 1.5 Load Name
	name := os.Getenv("SYS_ADMIN_NAME")
	if name == "" {
		name = "System Admin" // fallback
	}

	// 2. Connect to DB
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	repo := repository.NewRepository(db)

	// 2.5 Auto-Migrate to ensure schema is up to date
	if err := repo.AutoMigrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// 3. User Logic
	newUser := &core.User{
		Email:         email,
		FullName:      name,
		UserType:      core.UserTypeSystemAdmin,
		IsActive:      true,
		Status:        "active",
		EmailVerified: true,
	}

	// Check if user exists
	existingUser, err := repo.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		log.Printf("User with email %s exists. Updating name to: %s", email, name)
		existingUser.FullName = name
		existingUser.UserType = core.UserTypeSystemAdmin // Ensure role is correct
		existingUser.IsActive = true
		existingUser.Status = "active"
		existingUser.EmailVerified = true

		if err := repo.UpdateUser(existingUser); err != nil {
			log.Fatal("Failed to update system admin:", err)
		}
		log.Printf("System Admin (%s) updated successfully.", email)
		return
	}

	// 4. Create User
	if err := repo.CreateUser(newUser); err != nil {
		log.Fatal("Failed to create system admin:", err)
	}

	log.Printf("System Admin (%s) created successfully.", email)
}
