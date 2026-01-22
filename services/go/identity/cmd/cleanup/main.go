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
	case "list-users":
		listAllUsers(db)
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
	case "fix-user":
		if len(os.Args) < 3 {
			fmt.Println("Usage: cleanup fix-user <user_id>")
			return
		}
		fixBrokenUser(db, os.Args[2])
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
	fmt.Println("  list-users                 - List all users with their type info")
	fmt.Println("  delete-user <email>        - Delete a user by email (cascades to student record)")
	fmt.Println("  delete-student <user_id>   - Delete a student record by user_id")
	fmt.Println("  fix-user <user_id>         - Fix broken user (remove orphaned type records)")
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

func listAllUsers(db *gorm.DB) {
	var users []models.User
	db.Find(&users)

	fmt.Printf("\nTotal Users: %d\n\n", len(users))
	fmt.Printf("%-6s | %-30s | %-25s | %-15s | %-8s\n", "ID", "Email", "Name", "UserType", "Active")
	fmt.Println("-------|--------------------------------|---------------------------|-----------------|----------")

	for _, u := range users {
		fmt.Printf("%-6d | %-30s | %-25s | %-15s | %-8t\n",
			u.ID, u.Email, u.Name, u.UserType, u.IsActive)
	}

	fmt.Println("\nType-Specific Records:")
	fmt.Println("----------------------")

	// Check students
	var students []models.Student
	db.Find(&students)
	fmt.Printf("Students: %d records\n", len(students))
	for _, s := range students {
		var userEmail string
		db.Model(&models.User{}).Select("email").Where("id = ?", s.UserID).Scan(&userEmail)
		fmt.Printf("  - Student ID=%d, UserID=%d (%s), StudentNum=%s\n", s.ID, s.UserID, userEmail, s.StudentID)
	}

	// Check instructors
	var instructors []models.Instructor
	db.Find(&instructors)
	fmt.Printf("Instructors: %d records\n", len(instructors))
	for _, i := range instructors {
		var userEmail string
		db.Model(&models.User{}).Select("email").Where("id = ?", i.UserID).Scan(&userEmail)
		fmt.Printf("  - Instructor ID=%d, UserID=%d (%s), EmployeeID=%s\n", i.ID, i.UserID, userEmail, i.EmployeeID)
	}

	// Check system admins
	var sysAdmins []models.SystemAdmin
	db.Find(&sysAdmins)
	fmt.Printf("System Admins: %d records\n", len(sysAdmins))
	for _, a := range sysAdmins {
		var userEmail string
		db.Model(&models.User{}).Select("email").Where("id = ?", a.UserID).Scan(&userEmail)
		fmt.Printf("  - SystemAdmin ID=%d, UserID=%d (%s)\n", a.ID, a.UserID, userEmail)
	}

	// Check institute admins
	var instAdmins []models.InstituteAdmin
	db.Find(&instAdmins)
	fmt.Printf("Institute Admins: %d records\n", len(instAdmins))
	for _, a := range instAdmins {
		var userEmail string
		db.Model(&models.User{}).Select("email").Where("id = ?", a.UserID).Scan(&userEmail)
		fmt.Printf("  - InstituteAdmin ID=%d, UserID=%d (%s), InstituteID=%d\n", a.ID, a.UserID, userEmail, a.InstituteID)
	}
}

func fixBrokenUser(db *gorm.DB, userIDStr string) {
	var userID uint
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		fmt.Printf("Error: Invalid user_id '%s'\n", userIDStr)
		return
	}

	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		fmt.Printf("Error: User with ID %d not found\n", userID)
		return
	}

	fmt.Printf("Found user: ID=%d, Email=%s, Name=%s, Type=%s\n",
		user.ID, user.Email, user.Name, user.UserType)

	// Check for orphaned type-specific records
	fmt.Println("\nChecking for orphaned type records...")

	fixed := false

	// If user is student, check for extra instructor/admin records
	if user.UserType == models.UserTypeStudent {
		var instructor models.Instructor
		if err := db.Where("user_id = ?", userID).First(&instructor).Error; err == nil {
			fmt.Printf("⚠ Found orphaned Instructor record (ID=%d) for Student user\n", instructor.ID)
			fmt.Print("Delete it? (yes/no): ")
			var confirm string
			fmt.Scanln(&confirm)
			if confirm == "yes" {
				db.Delete(&instructor)
				fmt.Println("✓ Deleted orphaned Instructor record")
				fixed = true
			}
		}

		var sysAdmin models.SystemAdmin
		if err := db.Where("user_id = ?", userID).First(&sysAdmin).Error; err == nil {
			fmt.Printf("⚠ Found orphaned SystemAdmin record (ID=%d) for Student user\n", sysAdmin.ID)
			fmt.Print("Delete it? (yes/no): ")
			var confirm string
			fmt.Scanln(&confirm)
			if confirm == "yes" {
				db.Delete(&sysAdmin)
				fmt.Println("✓ Deleted orphaned SystemAdmin record")
				fixed = true
			}
		}

		var instAdmin models.InstituteAdmin
		if err := db.Where("user_id = ?", userID).First(&instAdmin).Error; err == nil {
			fmt.Printf("⚠ Found orphaned InstituteAdmin record (ID=%d) for Student user\n", instAdmin.ID)
			fmt.Print("Delete it? (yes/no): ")
			var confirm string
			fmt.Scanln(&confirm)
			if confirm == "yes" {
				db.Delete(&instAdmin)
				fmt.Println("✓ Deleted orphaned InstituteAdmin record")
				fixed = true
			}
		}

		// Check if student record is missing
		var student models.Student
		if err := db.Where("user_id = ?", userID).First(&student).Error; err != nil {
			fmt.Printf("⚠ Missing Student record for user_type='student'\n")
			fmt.Println("Note: You may need to recreate this user")
		}
	}

	if !fixed {
		fmt.Println("✓ No orphaned records found - user looks good!")
	}
}
