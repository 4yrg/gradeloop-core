package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/database"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/handlers"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/routes"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/service"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestServer(t *testing.T) (*httptest.Server, *database.Database) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	dbInstance := &database.Database{DB: db}
	err = dbInstance.AutoMigrate()
	assert.NoError(t, err)

	// Create all repositories
	userRepo := repository.NewUserRepository(db)
	instituteRepo := repository.NewInstituteRepository(db)
	facultyRepo := repository.NewFacultyRepository(db)
	departmentRepo := repository.NewDepartmentRepository(db)
	classRepo := repository.NewClassRepository(db)
	membershipRepo := repository.NewMembershipRepository(db)
	roleRepo := repository.NewRoleRepository(db)

	// Create all services
	userService := service.NewUserService(userRepo)
	instituteService := service.NewInstituteService(instituteRepo)
	facultyService := service.NewFacultyService(facultyRepo)
	departmentService := service.NewDepartmentService(departmentRepo)
	classService := service.NewClassService(classRepo)
	membershipService := service.NewMembershipService(membershipRepo)
	roleService := service.NewRoleService(roleRepo)

	// Create all handlers
	userHandler := handlers.NewUserHandler(userService)
	instituteHandler := handlers.NewInstituteHandler(instituteService)
	facultyHandler := handlers.NewFacultyHandler(facultyService)
	departmentHandler := handlers.NewDepartmentHandler(departmentService)
	classHandler := handlers.NewClassHandler(classService)
	membershipHandler := handlers.NewMembershipHandler(membershipService)
	roleHandler := handlers.NewRoleHandler(roleService)

	router := routes.NewRouter(
		userHandler,
		instituteHandler,
		facultyHandler,
		departmentHandler,
		classHandler,
		membershipHandler,
		roleHandler,
	)
	r := router.Setup()

	server := httptest.NewServer(r)
	return server, dbInstance
}

func TestHealthEndpoint(t *testing.T) {
	server, _ := setupTestServer(t)
	defer server.Close()

	resp, err := http.Get(server.URL + "/health")
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestCreateStudentAPI(t *testing.T) {
	server, _ := setupTestServer(t)
	defer server.Close()

	student := models.User{
		Email:    "api.student@example.com",
		Name:     "API Student",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "API001",
		},
	}

	body, _ := json.Marshal(student)
	resp, err := http.Post(server.URL+"/api/v1/users", "application/json", bytes.NewBuffer(body))
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.True(t, response["success"].(bool))
}

func TestGetUserAPI(t *testing.T) {
	server, db := setupTestServer(t)
	defer server.Close()

	// Create a user first
	user := &models.User{
		Email:    "getuser@example.com",
		Name:     "Get User",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "GET001",
		},
	}

	userRepo := repository.NewUserRepository(db.DB)
	err := userRepo.Create(user)
	assert.NoError(t, err)

	// Get the user via API
	resp, err := http.Get(server.URL + "/api/v1/users/" + user.ID)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestGetAllUsersAPI(t *testing.T) {
	server, db := setupTestServer(t)
	defer server.Close()

	// Create multiple users
	users := []*models.User{
		{
			Email:    "user1@example.com",
			Name:     "User 1",
			UserType: models.UserTypeStudent,
			Student:  &models.Student{StudentID: "U001"},
		},
		{
			Email:      "user2@example.com",
			Name:       "User 2",
			UserType:   models.UserTypeInstructor,
			Instructor: &models.Instructor{EmployeeID: "E001"},
		},
	}

	userRepo := repository.NewUserRepository(db.DB)
	for _, user := range users {
		err := userRepo.Create(user)
		assert.NoError(t, err)
	}

	resp, err := http.Get(server.URL + "/api/v1/users?limit=10&offset=0")
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["data"])
}
