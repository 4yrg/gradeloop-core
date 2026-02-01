package repository

import (
	"errors"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrUserNotFound = errors.New("user not found")
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// AutoMigrate applies schema changes
func (r *Repository) AutoMigrate() error {
	return r.db.AutoMigrate(
		&core.User{},
		&core.StudentProfile{},
		&core.InstructorProfile{},
		&core.InstituteAdminProfile{},
		&core.Institute{},
		&core.Faculty{},
		&core.Department{},
		&core.Class{},
		&core.ClassEnrollment{},
	)
}

// -- User Management --

func (r *Repository) CreateUser(user *core.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// GORM handles association creation if the struct fields are populated
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *Repository) GetUserByEmail(email string) (*core.User, error) {
	var user core.User
	// Optimized: Only preload profiles as needed rather than all at once
	err := r.db.
		Where("email = ?", email).
		First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	
	// Load the appropriate profile based on user type
	switch user.UserType {
	case core.UserTypeStudent:
		r.db.Preload("StudentProfile").Find(&user)
	case core.UserTypeInstructor:
		r.db.Preload("InstructorProfile").Find(&user)
	case core.UserTypeInstituteAdmin:
		r.db.Preload("InstituteAdminProfile").Find(&user)
	}
	
	return &user, nil
}

// GetUserByEmailWithProfile efficiently loads user with only the needed profile
func (r *Repository) GetUserByEmailWithProfile(email string) (*core.User, error) {
	var user core.User
	
	// Use a single query with conditional joins based on user_type
	subQuery := r.db.Table("users").
		Select("users.*, " +
			"sp.enrollment_number, sp.enrollment_year, " +
			"ip.employee_id, ip.specialization, " +
			"iap.institute_id").
		Joins("LEFT JOIN student_profiles sp ON users.id = sp.user_id AND users.user_type = ?", core.UserTypeStudent).
		Joins("LEFT JOIN instructor_profiles ip ON users.id = ip.user_id AND users.user_type = ?", core.UserTypeInstructor).
		Joins("LEFT JOIN institute_admin_profiles iap ON users.id = iap.user_id AND users.user_type = ?", core.UserTypeInstituteAdmin).
		Where("users.email = ? AND users.deleted_at IS NULL", email)
	
	err := subQuery.Scan(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

func (r *Repository) GetUserByID(id string) (*core.User, error) {
	var user core.User
	err := r.db.
		Where("id = ?", id).
		First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	
	// Load the appropriate profile based on user type
	switch user.UserType {
	case core.UserTypeStudent:
		r.db.Preload("StudentProfile").Find(&user)
	case core.UserTypeInstructor:
		r.db.Preload("InstructorProfile").Find(&user)
	case core.UserTypeInstituteAdmin:
		r.db.Preload("InstituteAdminProfile").Find(&user)
	}
	
	return &user, nil
}

func (r *Repository) UpdateUser(user *core.User) error {
	return r.db.Save(user).Error
}

func (r *Repository) DeleteUser(id string) error {
	return r.db.Delete(&core.User{}, "id = ?", id).Error
}

func (r *Repository) ListUsers(offset, limit int) ([]core.User, error) {
	var users []core.User
	// Optimized: Get users first, then load profiles based on user type
	err := r.db.Model(&core.User{}).
		Offset(offset).Limit(limit).Find(&users).Error
		
	if err != nil {
		return nil, err
	}
	
	// Group users by type and batch load their profiles
	var studentIDs, instructorIDs, adminIDs []interface{}
	
	for i, user := range users {
		switch user.UserType {
		case core.UserTypeStudent:
			studentIDs = append(studentIDs, user.ID)
		case core.UserTypeInstructor:
			instructorIDs = append(instructorIDs, user.ID)
		case core.UserTypeInstituteAdmin:
			adminIDs = append(adminIDs, user.ID)
		}
		users[i] = user
	}
	
	// Batch load profiles
	if len(studentIDs) > 0 {
		var profiles []core.StudentProfile
		r.db.Where("user_id IN ?", studentIDs).Find(&profiles)
		profileMap := make(map[string]*core.StudentProfile)
		for i := range profiles {
			profileMap[profiles[i].UserID.String()] = &profiles[i]
		}
		for i := range users {
			if users[i].UserType == core.UserTypeStudent {
				users[i].StudentProfile = profileMap[users[i].ID.String()]
			}
		}
	}
	
	if len(instructorIDs) > 0 {
		var profiles []core.InstructorProfile
		r.db.Where("user_id IN ?", instructorIDs).Find(&profiles)
		profileMap := make(map[string]*core.InstructorProfile)
		for i := range profiles {
			profileMap[profiles[i].UserID.String()] = &profiles[i]
		}
		for i := range users {
			if users[i].UserType == core.UserTypeInstructor {
				users[i].InstructorProfile = profileMap[users[i].ID.String()]
			}
		}
	}
	
	if len(adminIDs) > 0 {
		var profiles []core.InstituteAdminProfile
		r.db.Where("user_id IN ?", adminIDs).Find(&profiles)
		profileMap := make(map[string]*core.InstituteAdminProfile)
		for i := range profiles {
			profileMap[profiles[i].UserID.String()] = &profiles[i]
		}
		for i := range users {
			if users[i].UserType == core.UserTypeInstituteAdmin {
				users[i].InstituteAdminProfile = profileMap[users[i].ID.String()]
			}
		}
	}
	
	return users, nil
}

// -- Organization Management --

func (r *Repository) CreateInstitute(institute *core.Institute) error {
	return r.db.Create(institute).Error
}

func (r *Repository) UpdateInstitute(institute *core.Institute) error {
	return r.db.Save(institute).Error
}

func (r *Repository) DeleteInstitute(id string) error {
	return r.db.Delete(&core.Institute{}, "id = ?", id).Error
}

func (r *Repository) GetInstitutes(query string) ([]core.Institute, error) {
	var institutes []core.Institute
	db := r.db
	if query != "" {
		q := "%" + query + "%"
		db = db.Where("name LIKE ? OR code LIKE ?", q, q)
	}
	err := db.Find(&institutes).Error
	return institutes, err
}

func (r *Repository) CreateInstituteWithAdmins(institute *core.Institute, admins []*core.User) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(institute).Error; err != nil {
			return err
		}

		for _, admin := range admins {
			// Find or create admin
			var existingUser core.User
			err := tx.Where("email = ?", admin.Email).First(&existingUser).Error
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					// Create new user
					if err := tx.Create(admin).Error; err != nil {
						return err
					}
					existingUser = *admin
				} else {
					return err
				}
			}

			// Create InstituteAdminProfile
			profile := core.InstituteAdminProfile{
				UserID:      existingUser.ID,
				InstituteID: institute.ID,
			}
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&profile).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *Repository) GetInstituteByID(id string) (*core.Institute, error) {
	var institute core.Institute
	err := r.db.Preload("Faculties").First(&institute, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("institute not found")
	}
	return &institute, err
}

func (r *Repository) GetInstituteAdmins(instituteID string) ([]core.User, error) {
	var users []core.User
	err := r.db.
		Select("users.*").
		Table("users").
		Joins("JOIN institute_admin_profiles ON users.id = institute_admin_profiles.user_id").
		Where("institute_admin_profiles.institute_id = ?", instituteID).
		Find(&users).Error
	return users, err
}

func (r *Repository) AddInstituteAdmin(instituteID string, userID string, role string) error {
	// Parse UUIDs
	instituteUUID, err := uuid.Parse(instituteID)
	if err != nil {
		return err
	}
	
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	
	// Create the institute admin profile
	adminProfile := &core.InstituteAdminProfile{
		UserID:      userUUID,
		InstituteID: instituteUUID,
	}
	
	return r.db.Create(adminProfile).Error
}

func (r *Repository) RemoveInstituteAdmin(instituteID string, userID string) error {
	// Parse UUIDs
	instituteUUID, err := uuid.Parse(instituteID)
	if err != nil {
		return err
	}
	
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	
	// Remove the institute admin profile
	return r.db.Where("user_id = ? AND institute_id = ?", userUUID, instituteUUID).
		Delete(&core.InstituteAdminProfile{}).Error
}

func (r *Repository) CreateFaculty(faculty *core.Faculty) error {
	return r.db.Create(faculty).Error
}

func (r *Repository) UpdateFaculty(faculty *core.Faculty) error {
	return r.db.Save(faculty).Error
}

func (r *Repository) DeleteFaculty(id string) error {
	return r.db.Delete(&core.Faculty{}, "id = ?", id).Error
}

func (r *Repository) GetFacultyByID(id string) (*core.Faculty, error) {
	var faculty core.Faculty
	err := r.db.Preload("Departments").First(&faculty, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("faculty not found")
	}
	return &faculty, err
}

func (r *Repository) GetFacultiesByInstitute(instituteID string) ([]core.Faculty, error) {
	var faculties []core.Faculty
	err := r.db.Where("institute_id = ?", instituteID).Find(&faculties).Error
	return faculties, err
}

func (r *Repository) CreateDepartment(dept *core.Department) error {
	return r.db.Create(dept).Error
}

func (r *Repository) UpdateDepartment(dept *core.Department) error {
	return r.db.Save(dept).Error
}

func (r *Repository) DeleteDepartment(id string) error {
	return r.db.Delete(&core.Department{}, "id = ?", id).Error
}

func (r *Repository) GetDepartmentByID(id string) (*core.Department, error) {
	var dept core.Department
	err := r.db.Preload("Classes").First(&dept, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("department not found")
	}
	return &dept, err
}

func (r *Repository) GetDepartmentsByFaculty(facultyID string) ([]core.Department, error) {
	var depts []core.Department
	err := r.db.Where("faculty_id = ?", facultyID).Find(&depts).Error
	return depts, err
}

func (r *Repository) CreateClass(class *core.Class) error {
	return r.db.Create(class).Error
}

func (r *Repository) UpdateClass(class *core.Class) error {
	return r.db.Save(class).Error
}

func (r *Repository) DeleteClass(id string) error {
	return r.db.Delete(&core.Class{}, "id = ?", id).Error
}

func (r *Repository) GetClassByID(id string) (*core.Class, error) {
	var class core.Class
	err := r.db.Preload("Enrollments").First(&class, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("class not found")
	}
	return &class, err
}

func (r *Repository) GetClassesByDepartment(deptID string) ([]core.Class, error) {
	var classes []core.Class
	err := r.db.Where("department_id = ?", deptID).Find(&classes).Error
	return classes, err
}

// -- Memberships --

func (r *Repository) EnrollStudent(enrollment *core.ClassEnrollment) error {
	return r.db.Create(enrollment).Error
}

func (r *Repository) UnenrollStudent(classID, studentID string) error {
	return r.db.Where("class_id = ? AND student_id = ?", classID, studentID).Delete(&core.ClassEnrollment{}).Error
}

func (r *Repository) GetClassEnrollments(classID string) ([]core.ClassEnrollment, error) {
	var enrollments []core.ClassEnrollment
	// Maybe preload Student?
	err := r.db.Preload("Student").Where("class_id = ?", classID).Find(&enrollments).Error
	return enrollments, err
}

func (r *Repository) GetUserEnrollments(studentID string) ([]core.ClassEnrollment, error) {
	var enrollments []core.ClassEnrollment
	err := r.db.Preload("Class").Where("student_id = ?", studentID).Find(&enrollments).Error
	return enrollments, err
}
