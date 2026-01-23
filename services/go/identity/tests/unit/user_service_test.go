package unit

import (
	"testing"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/service"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Run migrations
	err = db.AutoMigrate(
		&models.User{},
		&models.Student{},
		&models.Instructor{},
		&models.SystemAdmin{},
		&models.InstituteAdmin{},
		&models.Role{},
		&models.UserRole{},
	)
	assert.NoError(t, err)

	return db
}

func TestCreateStudent(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	student := &models.User{
		Email:    "student@example.com",
		Name:     "John Doe",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S12345",
		},
	}

	err := userService.CreateUser(student)
	assert.NoError(t, err)
	assert.NotZero(t, student.ID)
	assert.NotNil(t, student.Student)
	assert.Equal(t, student.ID, student.Student.UserID)
}

func TestCreateInstructor(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	instructor := &models.User{
		Email:    "instructor@example.com",
		Name:     "Jane Smith",
		UserType: models.UserTypeInstructor,
		Instructor: &models.Instructor{
			EmployeeID: "E67890",
		},
	}

	err := userService.CreateUser(instructor)
	assert.NoError(t, err)
	assert.NotZero(t, instructor.ID)
	assert.NotNil(t, instructor.Instructor)
	assert.Equal(t, instructor.ID, instructor.Instructor.UserID)
}

func TestGetUserByID(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	// Create a student
	student := &models.User{
		Email:    "test@example.com",
		Name:     "Test User",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S11111",
		},
	}

	err := userService.CreateUser(student)
	assert.NoError(t, err)

	// Retrieve the student
	retrieved, err := userService.GetUserByID(student.ID)
	assert.NoError(t, err)
	assert.Equal(t, student.Email, retrieved.Email)
	assert.Equal(t, student.Name, retrieved.Name)
	assert.NotNil(t, retrieved.Student)
	assert.Equal(t, "S11111", retrieved.Student.StudentID)
}

func TestGetUserByEmail(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	student := &models.User{
		Email:    "unique@example.com",
		Name:     "Unique User",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S22222",
		},
	}

	err := userService.CreateUser(student)
	assert.NoError(t, err)

	retrieved, err := userService.GetUserByEmail("unique@example.com")
	assert.NoError(t, err)
	assert.Equal(t, student.ID, retrieved.ID)
	assert.Equal(t, student.Name, retrieved.Name)
}

func TestUniqueEmailConstraint(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	user1 := &models.User{
		Email:    "duplicate@example.com",
		Name:     "User 1",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S33333",
		},
	}

	err := userService.CreateUser(user1)
	assert.NoError(t, err)

	user2 := &models.User{
		Email:    "duplicate@example.com",
		Name:     "User 2",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S44444",
		},
	}

	err = userService.CreateUser(user2)
	assert.Error(t, err) // Should fail due to duplicate email
}

func TestValidationErrors(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	// Missing email
	user := &models.User{
		Name:     "No Email",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S55555",
		},
	}

	err := userService.CreateUser(user)
	assert.Error(t, err)

	// Missing student data for student user type
	user2 := &models.User{
		Email:    "nostudentdata@example.com",
		Name:     "No Student Data",
		UserType: models.UserTypeStudent,
	}

	err = userService.CreateUser(user2)
	assert.Error(t, err)
}
