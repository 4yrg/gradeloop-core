package repository

import (
	"errors"
	"fmt"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"gorm.io/gorm"
)

// InstituteRepository handles Institute CRUD operations
type InstituteRepository interface {
	Create(institute *models.Institute) error
	GetByID(id string) (*models.Institute, error)
	GetAll(limit, offset int) ([]models.Institute, int64, error)
	Update(institute *models.Institute) error
	Delete(id string) error
}

type instituteRepository struct {
	db *gorm.DB
}

func NewInstituteRepository(db *gorm.DB) InstituteRepository {
	return &instituteRepository{db: db}
}

func (r *instituteRepository) Create(institute *models.Institute) error {
	return r.db.Create(institute).Error
}

func (r *instituteRepository) GetByID(id string) (*models.Institute, error) {
	var institute models.Institute
	err := r.db.Preload("Faculties").First(&institute, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("institute not found")
		}
		return nil, err
	}
	return &institute, nil
}

func (r *instituteRepository) GetAll(limit, offset int) ([]models.Institute, int64, error) {
	var institutes []models.Institute
	var total int64

	if err := r.db.Model(&models.Institute{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Limit(limit).Offset(offset).Find(&institutes).Error
	return institutes, total, err
}

func (r *instituteRepository) Update(institute *models.Institute) error {
	return r.db.Save(institute).Error
}

func (r *instituteRepository) Delete(id string) error {
	return r.db.Delete(&models.Institute{}, "id = ?", id).Error
}

// FacultyRepository handles Faculty CRUD operations
type FacultyRepository interface {
	Create(faculty *models.Faculty) error
	GetByID(id string) (*models.Faculty, error)
	GetByInstituteID(instituteID string, limit, offset int) ([]models.Faculty, int64, error)
	Update(faculty *models.Faculty) error
	Delete(id string) error
}

type facultyRepository struct {
	db *gorm.DB
}

func NewFacultyRepository(db *gorm.DB) FacultyRepository {
	return &facultyRepository{db: db}
}

func (r *facultyRepository) Create(faculty *models.Faculty) error {
	return r.db.Create(faculty).Error
}

func (r *facultyRepository) GetByID(id string) (*models.Faculty, error) {
	var faculty models.Faculty
	err := r.db.Preload("Institute").Preload("Departments").First(&faculty, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("faculty not found")
		}
		return nil, err
	}
	return &faculty, nil
}

func (r *facultyRepository) GetByInstituteID(instituteID string, limit, offset int) ([]models.Faculty, int64, error) {
	var faculties []models.Faculty
	var total int64

	query := r.db.Model(&models.Faculty{}).Where("institute_id = ?", instituteID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(limit).Offset(offset).Find(&faculties).Error
	return faculties, total, err
}

func (r *facultyRepository) Update(faculty *models.Faculty) error {
	return r.db.Save(faculty).Error
}

func (r *facultyRepository) Delete(id string) error {
	return r.db.Delete(&models.Faculty{}, "id = ?", id).Error
}

// DepartmentRepository handles Department CRUD operations
type DepartmentRepository interface {
	Create(department *models.Department) error
	GetByID(id string) (*models.Department, error)
	GetByFacultyID(facultyID string, limit, offset int) ([]models.Department, int64, error)
	Update(department *models.Department) error
	Delete(id string) error
}

type departmentRepository struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) Create(department *models.Department) error {
	return r.db.Create(department).Error
}

func (r *departmentRepository) GetByID(id string) (*models.Department, error) {
	var department models.Department
	err := r.db.Preload("Faculty").Preload("Classes").First(&department, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("department not found")
		}
		return nil, err
	}
	return &department, nil
}

func (r *departmentRepository) GetByFacultyID(facultyID string, limit, offset int) ([]models.Department, int64, error) {
	var departments []models.Department
	var total int64

	query := r.db.Model(&models.Department{}).Where("faculty_id = ?", facultyID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(limit).Offset(offset).Find(&departments).Error
	return departments, total, err
}

func (r *departmentRepository) Update(department *models.Department) error {
	return r.db.Save(department).Error
}

func (r *departmentRepository) Delete(id string) error {
	return r.db.Delete(&models.Department{}, "id = ?", id).Error
}

// ClassRepository handles Class CRUD operations
type ClassRepository interface {
	Create(class *models.Class) error
	GetByID(id string) (*models.Class, error)
	GetByDepartmentID(departmentID string, limit, offset int) ([]models.Class, int64, error)
	Update(class *models.Class) error
	Delete(id string) error
}

type classRepository struct {
	db *gorm.DB
}

func NewClassRepository(db *gorm.DB) ClassRepository {
	return &classRepository{db: db}
}

func (r *classRepository) Create(class *models.Class) error {
	return r.db.Create(class).Error
}

func (r *classRepository) GetByID(id string) (*models.Class, error) {
	var class models.Class
	err := r.db.Preload("Department").First(&class, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("class not found")
		}
		return nil, err
	}
	return &class, nil
}

func (r *classRepository) GetByDepartmentID(departmentID string, limit, offset int) ([]models.Class, int64, error) {
	var classes []models.Class
	var total int64

	query := r.db.Model(&models.Class{}).Where("department_id = ?", departmentID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(limit).Offset(offset).Find(&classes).Error
	return classes, total, err
}

func (r *classRepository) Update(class *models.Class) error {
	return r.db.Save(class).Error
}

func (r *classRepository) Delete(id string) error {
	return r.db.Delete(&models.Class{}, "id = ?", id).Error
}
