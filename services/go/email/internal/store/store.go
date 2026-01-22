package store

import (
	"fmt"
	"log"

	"github.com/gradeloop/email-service/internal/config"
	"github.com/gradeloop/email-service/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Store struct {
	DB *gorm.DB
}

func New(cfg *config.Config) (*Store, error) {
	var dialector gorm.Dialector

	switch cfg.Database.Driver {
	case "sqlite":
		dialector = sqlite.Open(cfg.GetDSN())
	case "postgres":
		dialector = postgres.Open(cfg.GetDSN())
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", cfg.Database.Driver)
	}

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

	return &Store{DB: db}, nil
}

func (s *Store) AutoMigrate() error {
	log.Println("Running database migrations...")
	return s.DB.AutoMigrate(
		&models.EmailTemplate{},
		&models.EmailLog{},
	)
}

func (s *Store) Close() error {
	sqlDB, err := s.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Template operations
func (s *Store) CreateTemplate(t *models.EmailTemplate) error {
	return s.DB.Create(t).Error
}

func (s *Store) GetTemplateBySlug(slug string) (*models.EmailTemplate, error) {
	var t models.EmailTemplate
	err := s.DB.Where("slug = ?", slug).First(&t).Error
	return &t, err
}

func (s *Store) UpdateTemplate(t *models.EmailTemplate) error {
	return s.DB.Save(t).Error
}

func (s *Store) DeleteTemplate(id string) error {
	return s.DB.Delete(&models.EmailTemplate{}, "id = ?", id).Error
}

func (s *Store) ListTemplates() ([]models.EmailTemplate, error) {
	var ts []models.EmailTemplate
	err := s.DB.Find(&ts).Error
	return ts, err
}

// Log operations
func (s *Store) CreateLog(l *models.EmailLog) error {
	return s.DB.Create(l).Error
}

func (s *Store) UpdateLog(l *models.EmailLog) error {
	return s.DB.Save(l).Error
}

func (s *Store) GetLog(id string) (*models.EmailLog, error) {
	var l models.EmailLog
	err := s.DB.Preload("Template").First(&l, "id = ?", id).Error
	return &l, err
}
