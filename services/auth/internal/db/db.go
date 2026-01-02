package db

import (
	"github.com/gradeloop/auth-service/internal/config"
	"github.com/gradeloop/auth-service/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto Migrate
	err = db.AutoMigrate(&models.User{}, &models.Institute{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
