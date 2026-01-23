package unit

import (
	"testing"
	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/service"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupMembershipTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Run migrations
	err = db.AutoMigrate(
		&models.User{},
		&models.Student{},
		&models.Institute{},
		&models.Faculty{},
		&models.Department{},
		&models.Class{},
		&models.StudentMembership{},
	)
	assert.NoError(t, err)

	return db
}

func createTestOrganizationHierarchy(t *testing.T, db *gorm.DB) (string, string, string, string, string) {
	// Create organization hierarchy and return IDs
	instituteRepo := repository.NewInstituteRepository(db)
	instituteService := service.NewInstituteService(instituteRepo)
	institute := &models.Institute{Name: "UOE", Code: "UOE", IsActive: true}
	err := instituteService.CreateInstitute(institute)
	assert.NoError(t, err)

	facultyRepo := repository.NewFacultyRepository(db)
	facultyService := service.NewFacultyService(facultyRepo)
	faculty := &models.Faculty{InstituteID: institute.ID, Name: "Engineering", Code: "ENG", IsActive: true}
	err = facultyService.CreateFaculty(faculty)
	assert.NoError(t, err)

	departmentRepo := repository.NewDepartmentRepository(db)
	departmentService := service.NewDepartmentService(departmentRepo)
	department := &models.Department{FacultyID: faculty.ID, Name: "CS", Code: "CS", IsActive: true}
	err = departmentService.CreateDepartment(department)
	assert.NoError(t, err)

	classRepo := repository.NewClassRepository(db)
	classService := service.NewClassService(classRepo)
	class := &models.Class{
		DepartmentID: department.ID,
		Name:         "CS Year 1",
		Code:         "CS-Y1",
		Year:         1,
		Semester:     1,
		IsActive:     true,
	}
	err = classService.CreateClass(class)
	assert.NoError(t, err)

	// Create student
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	student := &models.User{
		Email:    "student@example.com",
		Name:     "Test Student",
		UserType: models.UserTypeStudent,
		Student: &models.Student{
			StudentID: "S12345",
		},
	}
	err = userService.CreateUser(student)
	assert.NoError(t, err)

	return student.Student.ID, faculty.ID, department.ID, class.ID, institute.ID
}

func TestCreateStudentMembership(t *testing.T) {
	db := setupMembershipTestDB(t)
	studentID, facultyID, departmentID, classID, _ := createTestOrganizationHierarchy(t, db)

	membershipRepo := repository.NewMembershipRepository(db)
	membershipService := service.NewMembershipService(membershipRepo)

	membership := &models.StudentMembership{
		StudentID:    studentID,
		FacultyID:    facultyID,
		DepartmentID: departmentID,
		ClassID:      classID,
		StartDate:    models.FlexibleTime(time.Now()),
		IsCurrent:    true,
	}

	err := membershipService.CreateMembership(membership)
	assert.NoError(t, err)
	assert.NotEmpty(t, membership.ID)
}

func TestGetCurrentMembership(t *testing.T) {
	db := setupMembershipTestDB(t)
	studentID, facultyID, departmentID, classID, _ := createTestOrganizationHierarchy(t, db)

	membershipRepo := repository.NewMembershipRepository(db)
	membershipService := service.NewMembershipService(membershipRepo)

	membership := &models.StudentMembership{
		StudentID:    studentID,
		FacultyID:    facultyID,
		DepartmentID: departmentID,
		ClassID:      classID,
		StartDate:    models.FlexibleTime(time.Now()),
		IsCurrent:    true,
	}

	err := membershipService.CreateMembership(membership)
	assert.NoError(t, err)

	// Get current membership
	current, err := membershipService.GetCurrentMembershipByStudentID(studentID)
	assert.NoError(t, err)
	assert.NotNil(t, current)
	assert.True(t, current.IsCurrent)
	assert.Equal(t, studentID, current.StudentID)
}

func TestTransferStudent(t *testing.T) {
	db := setupMembershipTestDB(t)
	studentID, facultyID, departmentID, classID, _ := createTestOrganizationHierarchy(t, db)

	membershipRepo := repository.NewMembershipRepository(db)
	membershipService := service.NewMembershipService(membershipRepo)

	// Create initial membership
	membership := &models.StudentMembership{
		StudentID:    studentID,
		FacultyID:    facultyID,
		DepartmentID: departmentID,
		ClassID:      classID,
		StartDate:    models.FlexibleTime(time.Now()),
		IsCurrent:    true,
	}
	err := membershipService.CreateMembership(membership)
	assert.NoError(t, err)

	// Create new class for transfer
	classRepo := repository.NewClassRepository(db)
	classService := service.NewClassService(classRepo)
	newClass := &models.Class{
		DepartmentID: departmentID,
		Name:         "CS Year 2",
		Code:         "CS-Y2",
		Year:         2,
		Semester:     1,
		IsActive:     true,
	}
	err = classService.CreateClass(newClass)
	assert.NoError(t, err)

	// Transfer student to new class
	err = membershipService.TransferStudent(studentID, facultyID, departmentID, newClass.ID)
	assert.NoError(t, err)

	// Verify old membership is no longer current
	oldMembership, err := membershipRepo.GetByStudentID(studentID)
	assert.NoError(t, err)
	assert.Len(t, oldMembership, 2) // Should have 2 memberships now

	// Verify new membership is current
	currentMembership, err := membershipService.GetCurrentMembershipByStudentID(studentID)
	assert.NoError(t, err)
	assert.Equal(t, newClass.ID, currentMembership.ClassID)
	assert.True(t, currentMembership.IsCurrent)
}

func TestMembershipHistory(t *testing.T) {
	db := setupMembershipTestDB(t)
	studentID, facultyID, departmentID, classID, _ := createTestOrganizationHierarchy(t, db)

	membershipRepo := repository.NewMembershipRepository(db)
	membershipService := service.NewMembershipService(membershipRepo)

	// Create initial membership
	membership1 := &models.StudentMembership{
		StudentID:    studentID,
		FacultyID:    facultyID,
		DepartmentID: departmentID,
		ClassID:      classID,
		StartDate:    models.FlexibleTime(time.Now().AddDate(0, -6, 0)), // 6 months ago
		IsCurrent:    true,
	}
	membershipService.CreateMembership(membership1)

	// Create second class
	classRepo := repository.NewClassRepository(db)
	classService := service.NewClassService(classRepo)
	class2 := &models.Class{
		DepartmentID: departmentID,
		Name:         "CS Year 2",
		Code:         "CS-Y2",
		Year:         2,
		Semester:     1,
		IsActive:     true,
	}
	classService.CreateClass(class2)

	// Transfer to new class
	membershipService.TransferStudent(studentID, facultyID, departmentID, class2.ID)

	// Get all memberships (history)
	memberships, err := membershipService.GetMembershipsByStudentID(studentID)
	assert.NoError(t, err)
	assert.Len(t, memberships, 2)

	// Verify only one is current
	currentCount := 0
	for _, m := range memberships {
		if m.IsCurrent {
			currentCount++
		}
	}
	assert.Equal(t, 1, currentCount)
}
