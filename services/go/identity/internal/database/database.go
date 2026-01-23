package database

import (
	"fmt"
	"log"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/config"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB *gorm.DB
}

func New(cfg *config.Config) (*Database, error) {
	var dialector gorm.Dialector

	switch cfg.Database.Driver {
	case "sqlite":
		dialector = sqlite.Open(cfg.GetDSN())
	case "postgres":
		dialector = postgres.Open(cfg.GetDSN())
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", cfg.Database.Driver)
	}

	// Configure GORM logger level
	var logLevel logger.LogLevel
	switch cfg.Logging.Level {
	case "debug":
		logLevel = logger.Info
	case "info":
		logLevel = logger.Warn
	default:
		logLevel = logger.Error
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Printf("Connected to %s database successfully", cfg.Database.Driver)

	return &Database{DB: db}, nil
}

func (d *Database) AutoMigrate() error {
	log.Println("Running database migrations...")

	return d.DB.AutoMigrate(
		&models.User{},
		&models.Student{},
		&models.Instructor{},
		&models.SystemAdmin{},
		&models.InstituteAdmin{},
		&models.Institute{},
		&models.Faculty{},
		&models.Department{},
		&models.Class{},
		&models.StudentMembership{},
		&models.Role{},
		&models.UserRole{},
	)
}

func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
