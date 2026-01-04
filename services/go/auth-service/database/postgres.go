package database

import (
	"fmt"
	"log"
	"os"

	"github.com/gradeloop/auth-service/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Database connection established")

	// AutoMigrate
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}

	// Manual Cleanup: Drop username column if it exists to avoid NOT NULL constraints
	// and ensure email column is properly set up.
	cleanupSQL := `
		DO $$ 
		BEGIN 
			IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
				ALTER TABLE users DROP COLUMN username;
			END IF;
		END $$;
	`
	if err := DB.Exec(cleanupSQL).Error; err != nil {
		log.Printf("Warning: Failed to drop username column: %v", err)
	}

	// Ensure email and role are NOT NULL if they were added as nullable previously
	// First cleanup any invalid rows with empty/null email to avoid constraint failure
	DB.Exec("DELETE FROM users WHERE email IS NULL OR email = ''")
	DB.Exec("ALTER TABLE users ALTER COLUMN email SET NOT NULL")
	DB.Exec("ALTER TABLE users ALTER COLUMN role SET NOT NULL")

	log.Println("Database migrated and cleaned up")
}
