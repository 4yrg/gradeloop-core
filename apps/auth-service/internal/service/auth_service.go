package service

import (
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gradeloop/auth-service/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedUsers(db *gorm.DB) error {
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	log.Println("Seeding default users...")

	users := []models.User{
		{
			Email: "admin@gradeloop.com",
			Role:  models.RoleSystemAdmin,
		},
		{
			Email: "inst_admin@gradeloop.com",
			Role:  models.RoleInstituteAdmin,
		},
		{
			Email: "instructor@gradeloop.com",
			Role:  models.RoleInstructor,
		},
		{
			Email: "student@gradeloop.com",
			Role:  models.RoleStudent,
		},
	}

	password := "password123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	for _, u := range users {
		u.PasswordHash = string(hash)
		if err := db.Create(&u).Error; err != nil {
			return err
		}
		log.Printf("Created User: %s | Role: %s | Password: %s", u.Email, u.Role, password)
	}

	return nil
}

type AuthService struct {
	db        *gorm.DB
	jwtSecret string
}

func NewAuthService(db *gorm.DB, jwtSecret string) *AuthService {
	return &AuthService{db: db, jwtSecret: jwtSecret}
}

func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, "", errors.New("invalid credentials") // User not found
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials") // Invalid password
	}

	// Generate JWT
	token, err := s.generateToken(&user)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 72).Unix(), // 3 days
	}

	if user.InstituteID != nil {
		claims["institute_id"] = user.InstituteID
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
