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

func setupOrgTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	// Run migrations
	err = db.AutoMigrate(
		&models.Institute{},
		&models.Faculty{},
		&models.Department{},
		&models.Class{},
	)
	assert.NoError(t, err)

	return db
}

func TestCreateInstitute(t *testing.T) {
	db := setupOrgTestDB(t)

	instituteRepo := repository.NewInstituteRepository(db)
	instituteService := service.NewInstituteService(instituteRepo)

	institute := &models.Institute{
		Name:        "University of Example",
		Code:        "UOE",
		Description: "A prestigious university",
		IsActive:    true,
	}

	err := instituteService.CreateInstitute(institute)
	assert.NoError(t, err)
	assert.NotEmpty(t, institute.ID)
}

func TestCreateFaculty(t *testing.T) {
	db := setupOrgTestDB(t)

	instituteRepo := repository.NewInstituteRepository(db)
	instituteService := service.NewInstituteService(instituteRepo)

	// Create institute first
	institute := &models.Institute{
		Name:     "University of Example",
		Code:     "UOE",
		IsActive: true,
	}
	err := instituteService.CreateInstitute(institute)
	assert.NoError(t, err)

	// Create faculty
	facultyRepo := repository.NewFacultyRepository(db)
	facultyService := service.NewFacultyService(facultyRepo)

	faculty := &models.Faculty{
		InstituteID: institute.ID,
		Name:        "Faculty of Engineering",
		Code:        "ENG",
		Description: "Engineering programs",
		IsActive:    true,
	}

	err = facultyService.CreateFaculty(faculty)
	assert.NoError(t, err)
	assert.NotEmpty(t, faculty.ID)
	assert.Equal(t, institute.ID, faculty.InstituteID)
}

func TestCreateDepartment(t *testing.T) {
	db := setupOrgTestDB(t)

	// Create hierarchy: Institute -> Faculty -> Department
	instituteRepo := repository.NewInstituteRepository(db)
	instituteService := service.NewInstituteService(instituteRepo)

	institute := &models.Institute{
		Name:     "University of Example",
		Code:     "UOE",
		IsActive: true,
	}
	err := instituteService.CreateInstitute(institute)
	assert.NoError(t, err)

	facultyRepo := repository.NewFacultyRepository(db)
	facultyService := service.NewFacultyService(facultyRepo)

	faculty := &models.Faculty{
		InstituteID: institute.ID,
		Name:        "Faculty of Engineering",
		Code:        "ENG",
		IsActive:    true,
	}
	err = facultyService.CreateFaculty(faculty)
	assert.NoError(t, err)

	departmentRepo := repository.NewDepartmentRepository(db)
	departmentService := service.NewDepartmentService(departmentRepo)

	department := &models.Department{
		FacultyID:   faculty.ID,
		Name:        "Computer Science",
		Code:        "CS",
		Description: "Computer Science programs",
		IsActive:    true,
	}
	err = departmentService.CreateDepartment(department)
	assert.NoError(t, err)
	assert.NotEmpty(t, department.ID)
	assert.Equal(t, faculty.ID, department.FacultyID)
}

func TestCreateClass(t *testing.T) {
	db := setupOrgTestDB(t)

	// Create full hierarchy
	instituteRepo := repository.NewInstituteRepository(db)
	instituteService := service.NewInstituteService(instituteRepo)
	institute := &models.Institute{Name: "UOE", Code: "UOE", IsActive: true}
	instituteService.CreateInstitute(institute)

	facultyRepo := repository.NewFacultyRepository(db)
	facultyService := service.NewFacultyService(facultyRepo)
	faculty := &models.Faculty{InstituteID: institute.ID, Name: "Engineering", Code: "ENG", IsActive: true}
	facultyService.CreateFaculty(faculty)

	departmentRepo := repository.NewDepartmentRepository(db)
	departmentService := service.NewDepartmentService(departmentRepo)
	department := &models.Department{FacultyID: faculty.ID, Name: "CS", Code: "CS", IsActive: true}
	departmentService.CreateDepartment(department)

	classRepo := repository.NewClassRepository(db)
	classService := service.NewClassService(classRepo)

	class := &models.Class{
		DepartmentID: department.ID,
		Name:         "CS Year 1 - Semester 1",
		Code:         "CS-Y1-S1",
		Year:         1,
		Semester:     1,
		IsActive:     true,
	}

	err := classService.CreateClass(class)
	assert.NoError(t, err)
	assert.NotEmpty(t, class.ID)
	assert.Equal(t, department.ID, class.DepartmentID)
}

func TestGetFacultiesByInstitute(t *testing.T) {
	db := setupOrgTestDB(t)

	instituteRepo := repository.NewInstituteRepository(db)
	instituteService := service.NewInstituteService(instituteRepo)
	institute := &models.Institute{Name: "UOE", Code: "UOE", IsActive: true}
	instituteService.CreateInstitute(institute)

	facultyRepo := repository.NewFacultyRepository(db)
	facultyService := service.NewFacultyService(facultyRepo)

	// Create multiple faculties
	faculty1 := &models.Faculty{InstituteID: institute.ID, Name: "Engineering", Code: "ENG", IsActive: true}
	faculty2 := &models.Faculty{InstituteID: institute.ID, Name: "Science", Code: "SCI", IsActive: true}

	facultyService.CreateFaculty(faculty1)
	facultyService.CreateFaculty(faculty2)

	// Get all faculties for this institute
	faculties, total, err := facultyService.GetFacultiesByInstituteID(institute.ID, 10, 0)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), total)
	assert.Len(t, faculties, 2)
}
