package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/gradeloop/auth-service/database"
	"github.com/gradeloop/auth-service/models"
	"golang.org/x/crypto/bcrypt"
)

// GenerateResetToken generates a secure random token for password reset
func GenerateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SendResetEmail sends a password reset email to the user
// In a real application, this would use an email service like SendGrid, AWS SES, etc.
func SendResetEmail(email, token string) error {
	// Get the frontend URL from environment variable
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	resetLink := fmt.Sprintf("%s/auth/reset-password?token=%s", frontendURL, token)

	// For development, just log the reset link
	// In production, replace this with actual email sending logic
	fmt.Printf("\n==============================================\n")
	fmt.Printf("PASSWORD RESET EMAIL\n")
	fmt.Printf("==============================================\n")
	fmt.Printf("To: %s\n", email)
	fmt.Printf("Subject: Password Reset Request\n\n")
	fmt.Printf("Click the following link to reset your password:\n")
	fmt.Printf("%s\n", resetLink)
	fmt.Printf("\nThis link will expire in 1 hour.\n")
	fmt.Printf("==============================================\n\n")

	// TODO: Integrate with actual email service
	// Example with SendGrid:
	// from := mail.NewEmail("GradeLoop", "noreply@gradeloop.com")
	// to := mail.NewEmail("", email)
	// subject := "Password Reset Request"
	// plainTextContent := fmt.Sprintf("Click the following link to reset your password: %s", resetLink)
	// htmlContent := fmt.Sprintf(`
	//     <p>Click the following link to reset your password:</p>
	//     <a href="%s">Reset Password</a>
	//     <p>This link will expire in 1 hour.</p>
	// `, resetLink)
	// message := mail.NewSingleEmail(from, subject, to, plainTextContent, htmlContent)
	// client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	// _, err := client.Send(message)
	// return err

	return nil
}

// CreatePasswordResetToken creates a password reset token for a user
func CreatePasswordResetToken(email string) (string, error) {
	var user models.User
	if result := database.DB.Where("email = ?", email).First(&user); result.Error != nil {
		// Don't reveal whether the user exists or not
		return "", nil
	}

	token, err := GenerateResetToken()
	if err != nil {
		return "", err
	}

	// Token expires in 1 hour
	expiresAt := time.Now().Add(1 * time.Hour)
	user.PasswordResetToken = &token
	user.PasswordResetExpires = &expiresAt

	if result := database.DB.Save(&user); result.Error != nil {
		return "", result.Error
	}

	// Send the reset email
	if err := SendResetEmail(email, token); err != nil {
		return "", err
	}

	return token, nil
}

// ValidateResetToken checks if a reset token is valid
func ValidateResetToken(token string) (*models.User, error) {
	var user models.User
	if result := database.DB.Where("password_reset_token = ?", token).First(&user); result.Error != nil {
		return nil, fmt.Errorf("invalid token")
	}

	// Check if token has expired
	if user.PasswordResetExpires == nil || time.Now().After(*user.PasswordResetExpires) {
		return nil, fmt.Errorf("token has expired")
	}

	return &user, nil
}

// ResetPassword resets a user's password using a valid token
func ResetPassword(token, newPassword string) error {
	user, err := ValidateResetToken(token)
	if err != nil {
		return err
	}

	// Hash the new password
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password and clear reset token
	user.PasswordHash = string(hash)
	user.PasswordResetToken = nil
	user.PasswordResetExpires = nil

	if result := database.DB.Save(user); result.Error != nil {
		return result.Error
	}

	return nil
}
