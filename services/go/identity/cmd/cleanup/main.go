package main

import (
	"fmt"
	"log"
	"os"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// Connect to database
	db, err := gorm.Open(sqlite.Open("identity.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if len(os.Args) < 2 {
		showHelp()
		return
	}

	command := os.Args[1]

	switch command {
	case "check":
		checkDuplicates(db)
	case "list-students":
		listStudents(db)
	case "delete-user":
		if len(os.Args) < 3 {
			fmt.Println("Usage: cleanup delete-user <email>")
			return
		}
		deleteUserByEmail(db, os.Args[2])
	case "delete-student":
		if len(os.Args) < 3 {
			fmt.Println("Usage: cleanup delete-student <user_id>")
			return
		}
		deleteStudentByUserID(db, os.Args[2])
	default:
		showHelp()
	}
}

func showHelp() {
	fmt.Println("Identity Database Cleanup Utility")
	fmt.Println("\nUsage:")
	fmt.Println("  go run cmd/cleanup/main.go <command>")
	fmt.Println("\nCommands:")
	fmt.Println("  check                      - Check for duplicate student records")
	fmt.Println("  list-students              - List all students")
	fmt.Println("  delete-user <email>        - Delete a user by email (cascades to student record)")
	fmt.Println("  delete-student <user_id>   - Delete a student record by user_id")
}

func checkDuplicates(db *gorm.DB) {
	fmt.Println("Checking for duplicate student records...")

	// Check for duplicate user_ids in students table
	var duplicates []struct {
		UserID uint
		Count  int64
	}

	db.Model(&models.Student{}).
		Select("user_id, COUNT(*) as count").
		Group("user_id").
		Having("count > 1").
		Scan(&duplicates)

	if len(duplicates) == 0 {
		fmt.Println("✓ No duplicate student records found")
	} else {
		fmt.Printf("✗ Found %d user(s) with duplicate student records:\n", len(duplicates))
		for _, dup := range duplicates {
			fmt.Printf("  - UserID %d has %d student records\n", dup.UserID, dup.Count)
		}
	}

	// Check for orphaned student records
	var orphanedCount int64
	db.Table("students").
		Joins("LEFT JOIN users ON students.user_id = users.id").
		Where("users.id IS NULL").
		Count(&orphanedCount)

	if orphanedCount > 0 {
		fmt.Printf("✗ Found %d orphaned student records (no matching user)\n", orphanedCount)
	} else {
		fmt.Println("✓ No orphaned student records found")
	}
}

func listStudents(db *gorm.DB) {
	var results []struct {
		UserID     uint
		UserEmail  string
		UserName   string
		StudentID  uint
		StudentNum string
	}

	db.Table("students").
		Select("users.id as user_id, users.email as user_email, users.name as user_name, students.id as student_id, students.student_id as student_num").
		Joins("LEFT JOIN users ON students.user_id = users.id").
		Scan(&results)

	fmt.Printf("\nTotal Students: %d\n\n", len(results))
	fmt.Printf("%-8s | %-30s | %-25s | %-12s | %-15s\n", "UserID", "Email", "Name", "StudentID", "StudentNum")
	fmt.Println("---------|--------------------------------|---------------------------|--------------|------------------")

	for _, r := range results {
		if r.UserEmail == "" {
			r.UserEmail = "<orphaned>"
			r.UserName = "<no user>"
		}
		fmt.Printf("%-8d | %-30s | %-25s | %-12d | %-15s\n",
			r.UserID, r.UserEmail, r.UserName, r.StudentID, r.StudentNum)
	}
}

func deleteUserByEmail(db *gorm.DB, email string) {
	var user models.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		fmt.Printf("Error: User with email '%s' not found\n", email)
		return
	}

	fmt.Printf("Found user: ID=%d, Email=%s, Name=%s, Type=%s\n",
		user.ID, user.Email, user.Name, user.UserType)
	fmt.Print("Are you sure you want to delete this user? (yes/no): ")

	var confirm string
	fmt.Scanln(&confirm)

	if confirm != "yes" {
		fmt.Println("Deletion cancelled")
		return
	}

	// Delete will cascade to student record due to foreign key constraint
	if err := db.Delete(&user).Error; err != nil {
		fmt.Printf("Error deleting user: %v\n", err)
		return
	}

	fmt.Println("✓ User deleted successfully (student record also deleted due to cascade)")
}

func deleteStudentByUserID(db *gorm.DB, userIDStr string) {
	var userID uint
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		fmt.Printf("Error: Invalid user_id '%s'\n", userIDStr)
		return
	}

	var student models.Student
	if err := db.Where("user_id = ?", userID).First(&student).Error; err != nil {
		fmt.Printf("Error: Student record with user_id=%d not found\n", userID)
		return
	}

	fmt.Printf("Found student: ID=%d, UserID=%d, StudentID=%s\n",
		student.ID, student.UserID, student.StudentID)
	fmt.Print("Are you sure you want to delete this student record? (yes/no): ")

	var confirm string
	fmt.Scanln(&confirm)

	if confirm != "yes" {
		fmt.Println("Deletion cancelled")
		return
	}

	if err := db.Delete(&student).Error; err != nil {
		fmt.Printf("Error deleting student: %v\n", err)
		return
	}

	fmt.Println("✓ Student record deleted successfully")
}
