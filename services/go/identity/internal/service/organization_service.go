package service

import (
	"fmt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/repository"
	"github.com/go-playground/validator/v10"
)

// InstituteService handles institute business logic
type InstituteService interface {
	CreateInstitute(institute *models.Institute) error
	GetInstituteByID(id string) (*models.Institute, error)
	GetAllInstitutes(limit, offset int) ([]models.Institute, int64, error)
	UpdateInstitute(institute *models.Institute) error
	DeleteInstitute(id string) error
}

type instituteService struct {
	instituteRepo repository.InstituteRepository
	validate      *validator.Validate
}

func NewInstituteService(instituteRepo repository.InstituteRepository) InstituteService {
	return &instituteService{
		instituteRepo: instituteRepo,
		validate:      validator.New(),
	}
}

func (s *instituteService) CreateInstitute(institute *models.Institute) error {
	if err := s.validate.Struct(institute); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.instituteRepo.Create(institute)
}

func (s *instituteService) GetInstituteByID(id string) (*models.Institute, error) {
	return s.instituteRepo.GetByID(id)
}

func (s *instituteService) GetAllInstitutes(limit, offset int) ([]models.Institute, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.instituteRepo.GetAll(limit, offset)
}

func (s *instituteService) UpdateInstitute(institute *models.Institute) error {
	if err := s.validate.Struct(institute); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.instituteRepo.Update(institute)
}

func (s *instituteService) DeleteInstitute(id string) error {
	return s.instituteRepo.Delete(id)
}

// FacultyService handles faculty business logic
type FacultyService interface {
	CreateFaculty(faculty *models.Faculty) error
	GetFacultyByID(id string) (*models.Faculty, error)
	GetFacultiesByInstituteID(instituteID string, limit, offset int) ([]models.Faculty, int64, error)
	UpdateFaculty(faculty *models.Faculty) error
	DeleteFaculty(id string) error
}

type facultyService struct {
	facultyRepo repository.FacultyRepository
	validate    *validator.Validate
}

func NewFacultyService(facultyRepo repository.FacultyRepository) FacultyService {
	return &facultyService{
		facultyRepo: facultyRepo,
		validate:    validator.New(),
	}
}

func (s *facultyService) CreateFaculty(faculty *models.Faculty) error {
	if err := s.validate.Struct(faculty); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.facultyRepo.Create(faculty)
}

func (s *facultyService) GetFacultyByID(id string) (*models.Faculty, error) {
	return s.facultyRepo.GetByID(id)
}

func (s *facultyService) GetFacultiesByInstituteID(instituteID string, limit, offset int) ([]models.Faculty, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.facultyRepo.GetByInstituteID(instituteID, limit, offset)
}

func (s *facultyService) UpdateFaculty(faculty *models.Faculty) error {
	if err := s.validate.Struct(faculty); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.facultyRepo.Update(faculty)
}

func (s *facultyService) DeleteFaculty(id string) error {
	return s.facultyRepo.Delete(id)
}

// DepartmentService handles department business logic
type DepartmentService interface {
	CreateDepartment(department *models.Department) error
	GetDepartmentByID(id string) (*models.Department, error)
	GetDepartmentsByFacultyID(facultyID string, limit, offset int) ([]models.Department, int64, error)
	UpdateDepartment(department *models.Department) error
	DeleteDepartment(id string) error
}

type departmentService struct {
	departmentRepo repository.DepartmentRepository
	validate       *validator.Validate
}

func NewDepartmentService(departmentRepo repository.DepartmentRepository) DepartmentService {
	return &departmentService{
		departmentRepo: departmentRepo,
		validate:       validator.New(),
	}
}

func (s *departmentService) CreateDepartment(department *models.Department) error {
	if err := s.validate.Struct(department); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.departmentRepo.Create(department)
}

func (s *departmentService) GetDepartmentByID(id string) (*models.Department, error) {
	return s.departmentRepo.GetByID(id)
}

func (s *departmentService) GetDepartmentsByFacultyID(facultyID string, limit, offset int) ([]models.Department, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.departmentRepo.GetByFacultyID(facultyID, limit, offset)
}

func (s *departmentService) UpdateDepartment(department *models.Department) error {
	if err := s.validate.Struct(department); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.departmentRepo.Update(department)
}

func (s *departmentService) DeleteDepartment(id string) error {
	return s.departmentRepo.Delete(id)
}

// ClassService handles class business logic
type ClassService interface {
	CreateClass(class *models.Class) error
	GetClassByID(id string) (*models.Class, error)
	GetClassesByDepartmentID(departmentID string, limit, offset int) ([]models.Class, int64, error)
	UpdateClass(class *models.Class) error
	DeleteClass(id string) error
}

type classService struct {
	classRepo repository.ClassRepository
	validate  *validator.Validate
}

func NewClassService(classRepo repository.ClassRepository) ClassService {
	return &classService{
		classRepo: classRepo,
		validate:  validator.New(),
	}
}

func (s *classService) CreateClass(class *models.Class) error {
	if err := s.validate.Struct(class); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.classRepo.Create(class)
}

func (s *classService) GetClassByID(id string) (*models.Class, error) {
	return s.classRepo.GetByID(id)
}

func (s *classService) GetClassesByDepartmentID(departmentID string, limit, offset int) ([]models.Class, int64, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.classRepo.GetByDepartmentID(departmentID, limit, offset)
}

func (s *classService) UpdateClass(class *models.Class) error {
	if err := s.validate.Struct(class); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}
	return s.classRepo.Update(class)
}

func (s *classService) DeleteClass(id string) error {
	return s.classRepo.Delete(id)
}
