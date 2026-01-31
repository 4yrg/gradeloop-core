package service

import (
	"errors"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type IdentityService struct {
	repo *repository.Repository
}

func NewIdentityService(repo *repository.Repository) *IdentityService {
	return &IdentityService{repo: repo}
}

type CreateUserRequest struct {
	Email    string        `json:"email"`
	Password string        `json:"password"`
	FullName string        `json:"full_name"`
	UserType core.UserType `json:"user_type"`

	// Profile fields (simplified for request)
	// In a real app, these might be nested objects or specific request types
	EnrollmentNumber string `json:"enrollment_number,omitempty"` // For Student
	EmployeeID       string `json:"employee_id,omitempty"`       // For Instructor
	InstituteID      string `json:"institute_id,omitempty"`      // For Institute Admin
}

func (s *IdentityService) RegisterUser(req CreateUserRequest) (*core.User, error) {
	// 1. Hash Password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &core.User{
		Email:        req.Email,
		PasswordHash: string(hashedBytes),
		FullName:     req.FullName,
		UserType:     req.UserType,
		IsActive:     true,
	}

	// 2. Build Profile based on Type
	switch req.UserType {
	case core.UserTypeStudent:
		user.StudentProfile = &core.StudentProfile{
			EnrollmentNumber: req.EnrollmentNumber,
			// EnrollmentYear default?
		}
	case core.UserTypeInstructor:
		user.InstructorProfile = &core.InstructorProfile{
			EmployeeID: req.EmployeeID,
		}
	case core.UserTypeInstituteAdmin:
		// Parse uuid
		// user.InstituteAdminProfile = ...
	}

	// 3. Save
	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *IdentityService) ValidateCredentials(email, password string) (*core.User, bool, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, false, nil
		}
		return nil, false, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, false, nil
	}

	return user, true, nil
}

// -- Extended User Features --

func (s *IdentityService) GetUser(id string) (*core.User, error) {
	return s.repo.GetUserByID(id)
}

func (s *IdentityService) UpdateUser(id string, fullName string) (*core.User, error) {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	user.FullName = fullName
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *IdentityService) DeleteUser(id string) error {
	return s.repo.DeleteUser(id)
}

func (s *IdentityService) ListUsers(offset, limit int) ([]core.User, error) {
	return s.repo.ListUsers(offset, limit)
}

// -- Organization Management --

func (s *IdentityService) CreateInstitute(name, code string) (*core.Institute, error) {
	institute := &core.Institute{
		Name: name,
		Code: code,
	}
	if err := s.repo.CreateInstitute(institute); err != nil {
		return nil, err
	}
	return institute, nil
}

func (s *IdentityService) GetInstitutes() ([]core.Institute, error) {
	return s.repo.GetInstitutes()
}

func (s *IdentityService) CreateFaculty(instituteID, name string) (*core.Faculty, error) {
	id, err := uuid.Parse(instituteID)
	if err != nil {
		return nil, err
	}

	faculty := &core.Faculty{
		InstituteID: id,
		Name:        name,
	}
	if err := s.repo.CreateFaculty(faculty); err != nil {
		return nil, err
	}
	return faculty, nil
}

func (s *IdentityService) CreateDepartment(facultyID, name string) (*core.Department, error) {
	id, err := uuid.Parse(facultyID)
	if err != nil {
		return nil, err
	}

	dept := &core.Department{
		FacultyID: id,
		Name:      name,
	}
	if err := s.repo.CreateDepartment(dept); err != nil {
		return nil, err
	}
	return dept, nil
}

func (s *IdentityService) CreateClass(deptID, name string) (*core.Class, error) {
	id, err := uuid.Parse(deptID)
	if err != nil {
		return nil, err
	}

	class := &core.Class{
		DepartmentID: id,
		Name:         name,
	}
	if err := s.repo.CreateClass(class); err != nil {
		return nil, err
	}
	return class, nil
}

func (s *IdentityService) EnrollStudent(classID, studentID string) error {
	cID, err := uuid.Parse(classID)
	if err != nil {
		return err
	}
	sID, err := uuid.Parse(studentID)
	if err != nil {
		return err
	}

	enrollment := &core.ClassEnrollment{
		ClassID:   cID,
		StudentID: sID,
		// EnrolledAt: time.Now(), // GORM should handle if we add hook or default, otherwise explicit
	}
	return s.repo.EnrollStudent(enrollment)
}

func (s *IdentityService) UnenrollStudent(classID, studentID string) error {
	return s.repo.UnenrollStudent(classID, studentID)
}

func (s *IdentityService) GetClassEnrollments(classID string) ([]core.ClassEnrollment, error) {
	return s.repo.GetClassEnrollments(classID)
}

// -- Org Update/Delete Wrappers --

func (s *IdentityService) UpdateInstitute(id, name, code string) (*core.Institute, error) {
	inst, err := s.repo.GetInstituteByID(id)
	if err != nil {
		return nil, err
	}
	inst.Name = name
	inst.Code = code
	if err := s.repo.UpdateInstitute(inst); err != nil {
		return nil, err
	}
	return inst, nil
}

func (s *IdentityService) DeleteInstitute(id string) error {
	return s.repo.DeleteInstitute(id)
}

// ... similar wrappers could be added for Faculty/Dept/Class updates if needed.
// For brevity, let's assume direct usage or add them if specific logic is needed.
// Adding them for completeness as requested.

func (s *IdentityService) UpdateFaculty(id, name string) (*core.Faculty, error) {
	fac, err := s.repo.GetFacultyByID(id)
	if err != nil {
		return nil, err
	}
	fac.Name = name
	if err := s.repo.UpdateFaculty(fac); err != nil {
		return nil, err
	}
	return fac, nil
}

func (s *IdentityService) DeleteFaculty(id string) error {
	return s.repo.DeleteFaculty(id)
}

func (s *IdentityService) UpdateDepartment(id, name string) (*core.Department, error) {
	dept, err := s.repo.GetDepartmentByID(id)
	if err != nil {
		return nil, err
	}
	dept.Name = name
	if err := s.repo.UpdateDepartment(dept); err != nil {
		return nil, err
	}
	return dept, nil
}

func (s *IdentityService) DeleteDepartment(id string) error {
	return s.repo.DeleteDepartment(id)
}

func (s *IdentityService) UpdateClass(id, name string) (*core.Class, error) {
	class, err := s.repo.GetClassByID(id)
	if err != nil {
		return nil, err
	}
	class.Name = name
	if err := s.repo.UpdateClass(class); err != nil {
		return nil, err
	}
	return class, nil
}

func (s *IdentityService) DeleteClass(id string) error {
	return s.repo.DeleteClass(id)
}

func (s *IdentityService) GetFaculty(id string) (*core.Faculty, error) {
	return s.repo.GetFacultyByID(id)
}

func (s *IdentityService) GetDepartment(id string) (*core.Department, error) {
	return s.repo.GetDepartmentByID(id)
}

func (s *IdentityService) GetClass(id string) (*core.Class, error) {
	return s.repo.GetClassByID(id)
}

func (s *IdentityService) GetUserEnrollments(studentID string) ([]core.ClassEnrollment, error) {
	return s.repo.GetUserEnrollments(studentID)
}

func (s *IdentityService) UpdateCredentials(userID, newPassword string) error {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedBytes)
	return s.repo.UpdateUser(user)
}

func (s *IdentityService) GetUserRole(userID string) (string, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return "", err
	}
	return string(user.UserType), nil
}
