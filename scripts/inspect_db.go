package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dbPath := "./services/go/identity/identity.db"
	if len(os.Args) > 1 {
		dbPath = os.Args[1]
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║          Database Inspector - User Records                ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")
	fmt.Println()

	// Check if users table exists
	var tableCount int
	err = db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='users'").Scan(&tableCount)
	if err != nil {
		log.Fatalf("Failed to check for users table: %v", err)
	}

	if tableCount == 0 {
		fmt.Println("❌ Users table does not exist!")
		return
	}

	fmt.Println("✅ Users table exists")
	fmt.Println()

	// Count total users
	var totalUsers int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
	if err != nil {
		log.Fatalf("Failed to count users: %v", err)
	}

	fmt.Printf("Total users in database: %d\n", totalUsers)
	fmt.Println()

	if totalUsers == 0 {
		fmt.Println("No users found in database.")
		return
	}

	// Get recent users
	fmt.Println("═══════════════════════════════════════════════════════════")
	fmt.Println("Recent Users (last 10):")
	fmt.Println("═══════════════════════════════════════════════════════════")

	rows, err := db.Query(`
		SELECT id, email, name, user_type, is_active,
		       LENGTH(password_hash) as hash_length,
		       SUBSTR(password_hash, 1, 20) as hash_prefix,
		       created_at
		FROM users
		ORDER BY id DESC
		LIMIT 10
	`)
	if err != nil {
		log.Fatalf("Failed to query users: %v", err)
	}
	defer rows.Close()

	userDetails := []struct {
		ID         int
		Email      string
		Name       string
		UserType   string
		IsActive   bool
		HashLength int
		HashPrefix string
		CreatedAt  string
	}{}

	for rows.Next() {
		var user struct {
			ID         int
			Email      string
			Name       string
			UserType   string
			IsActive   bool
			HashLength int
			HashPrefix string
			CreatedAt  string
		}

		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.UserType,
			&user.IsActive,
			&user.HashLength,
			&user.HashPrefix,
			&user.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		userDetails = append(userDetails, user)

		fmt.Printf("\n┌─────────────────────────────────────────────────────────┐\n")
		fmt.Printf("│ User ID: %d\n", user.ID)
		fmt.Printf("├─────────────────────────────────────────────────────────┤\n")
		fmt.Printf("│ Email:       %s\n", user.Email)
		fmt.Printf("│ Name:        %s\n", user.Name)
		fmt.Printf("│ Type:        %s\n", user.UserType)
		fmt.Printf("│ Active:      %v\n", user.IsActive)
		fmt.Printf("│ Created:     %s\n", user.CreatedAt)
		fmt.Printf("│ Hash Length: %d bytes\n", user.HashLength)
		fmt.Printf("│ Hash Prefix: %s...\n", user.HashPrefix)

		// Validate hash format
		if user.HashLength != 60 {
			fmt.Printf("│ ⚠️  WARNING: Hash length should be 60 bytes (bcrypt)\n")
		}
		if len(user.HashPrefix) >= 7 && user.HashPrefix[:7] != "$2a$10$" && user.HashPrefix[:7] != "$2b$10$" {
			fmt.Printf("│ ⚠️  WARNING: Hash doesn't start with bcrypt prefix\n")
		}

		fmt.Printf("└─────────────────────────────────────────────────────────┘\n")
	}

	// Check type-specific tables
	fmt.Println()
	fmt.Println("═══════════════════════════════════════════════════════════")
	fmt.Println("Type-Specific Records:")
	fmt.Println("═══════════════════════════════════════════════════════════")

	for _, user := range userDetails {
		fmt.Printf("\nUser ID %d (%s):\n", user.ID, user.UserType)

		switch user.UserType {
		case "student":
			var studentID string
			var recordID int
			err := db.QueryRow("SELECT id, student_id FROM students WHERE user_id = ?", user.ID).Scan(&recordID, &studentID)
			if err == sql.ErrNoRows {
				fmt.Printf("  ❌ No student record found (MISSING!)\n")
			} else if err != nil {
				fmt.Printf("  ❌ Error querying student: %v\n", err)
			} else {
				fmt.Printf("  ✅ Student record exists (ID: %d, StudentID: %s)\n", recordID, studentID)
			}

		case "instructor":
			var employeeID string
			var recordID int
			err := db.QueryRow("SELECT id, employee_id FROM instructors WHERE user_id = ?", user.ID).Scan(&recordID, &employeeID)
			if err == sql.ErrNoRows {
				fmt.Printf("  ❌ No instructor record found (MISSING!)\n")
			} else if err != nil {
				fmt.Printf("  ❌ Error querying instructor: %v\n", err)
			} else {
				fmt.Printf("  ✅ Instructor record exists (ID: %d, EmployeeID: %s)\n", recordID, employeeID)
			}

		case "institute_admin":
			var instituteID int
			var recordID int
			err := db.QueryRow("SELECT id, institute_id FROM institute_admins WHERE user_id = ?", user.ID).Scan(&recordID, &instituteID)
			if err == sql.ErrNoRows {
				fmt.Printf("  ❌ No institute_admin record found (MISSING!)\n")
			} else if err != nil {
				fmt.Printf("  ❌ Error querying institute_admin: %v\n", err)
			} else {
				fmt.Printf("  ✅ InstituteAdmin record exists (ID: %d, InstituteID: %d)\n", recordID, instituteID)
			}

		case "system_admin":
			var recordID int
			err := db.QueryRow("SELECT id FROM system_admins WHERE user_id = ?", user.ID).Scan(&recordID)
			if err == sql.ErrNoRows {
				fmt.Printf("  ❌ No system_admin record found (MISSING!)\n")
			} else if err != nil {
				fmt.Printf("  ❌ Error querying system_admin: %v\n", err)
			} else {
				fmt.Printf("  ✅ SystemAdmin record exists (ID: %d)\n", recordID)
			}
		}
	}

	// Interactive password test
	fmt.Println()
	fmt.Println("═══════════════════════════════════════════════════════════")
	fmt.Println("Password Testing:")
	fmt.Println("═══════════════════════════════════════════════════════════")
	fmt.Println()
	fmt.Println("Usage: To test a password, run:")
	fmt.Printf("  go run scripts/inspect_db.go <email> <password>\n")
	fmt.Println()

	if len(os.Args) >= 3 {
		testEmail := os.Args[1]
		testPassword := os.Args[2]

		fmt.Printf("Testing login for: %s\n", testEmail)
		fmt.Printf("Password: %s\n", testPassword)
		fmt.Println()

		var userID int
		var storedHash string
		var email string

		err := db.QueryRow("SELECT id, email, password_hash FROM users WHERE email = ?", testEmail).Scan(&userID, &email, &storedHash)
		if err == sql.ErrNoRows {
			fmt.Printf("❌ User not found with email: %s\n", testEmail)
			return
		} else if err != nil {
			fmt.Printf("❌ Database error: %v\n", err)
			return
		}

		fmt.Printf("✅ User found (ID: %d)\n", userID)
		fmt.Printf("   Stored hash: %s...\n", storedHash[:20])
		fmt.Printf("   Hash length: %d bytes\n", len(storedHash))
		fmt.Println()

		err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(testPassword))
		if err == nil {
			fmt.Println("✅✅✅ PASSWORD MATCH! Login should succeed.")
		} else {
			fmt.Printf("❌❌❌ PASSWORD MISMATCH! Login will fail.\n")
			fmt.Printf("   Error: %v\n", err)
			fmt.Println()
			fmt.Println("Possible issues:")
			fmt.Println("  1. Password was not updated after user creation")
			fmt.Println("  2. UpdatePassword failed silently")
			fmt.Println("  3. Wrong password being tested")
			fmt.Println("  4. Password hash is corrupted")
		}
	}

	fmt.Println()
}
