package service

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/4yrg/gradeloop-core/services/go/identity/internal/config"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/core"
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type IdentityService struct {
	repo *repository.Repository
	cfg  *config.Config
}

func NewIdentityService(repo *repository.Repository, cfg *config.Config) *IdentityService {
	return &IdentityService{
		repo: repo,
		cfg:  cfg,
	}
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

type CreateInstituteAdminRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type CreateInstituteRequest struct {
	Name         string                        `json:"name"`
	Code         string                        `json:"code"`
	Domain       string                        `json:"domain"`
	ContactEmail string                        `json:"contact_email"`
	Admins       []CreateInstituteAdminRequest `json:"admins"`
}

type InstituteAdmin struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

type InstituteWithAdminsResponse struct {
	*core.Institute
	Admins []InstituteAdmin `json:"admins"`
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

func (s *IdentityService) LookupUser(email string) (*core.User, error) {
	return s.repo.GetUserByEmail(email)
}

// -- Organization Management --

func (s *IdentityService) CreateInstitute(req CreateInstituteRequest) (*core.Institute, error) {
	institute := &core.Institute{
		Name:         req.Name,
		Code:         req.Code,
		Domain:       req.Domain,
		ContactEmail: req.ContactEmail,
		IsActive:     true,
	}

	var admins []*core.User
	adminCredentials := make([]struct{ name, email, password string }, 0, len(req.Admins))
	
	for _, adminReq := range req.Admins {
		// Generate a random temporary password
		tokenBytes := make([]byte, 16)
		if _, err := rand.Read(tokenBytes); err != nil {
			return nil, fmt.Errorf("failed to generate temporary password: %w", err)
		}
		tempPassword := hex.EncodeToString(tokenBytes)[:12] + "!" // 12 chars + special char
		hashedBytes, _ := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)

		user := &core.User{
			Email:                  adminReq.Email,
			PasswordHash:           string(hashedBytes),
			FullName:               adminReq.Name,
			UserType:               core.UserTypeInstituteAdmin,
			IsActive:               true,
			RequiresPasswordChange: true,
		}
		admins = append(admins, user)
		
		// Store credentials for email sending
		adminCredentials = append(adminCredentials, struct{ name, email, password string }{
			name:     adminReq.Name,
			email:    adminReq.Email,
			password: tempPassword,
		})
	}

	if err := s.repo.CreateInstituteWithAdmins(institute, admins); err != nil {
		return nil, err
	}
	
	// Send invitation emails to all admins
	for _, cred := range adminCredentials {
		if err := s.sendAdminInvitationEmail(institute, cred.name, cred.email, cred.password, true); err != nil {
			fmt.Printf("[Identity] Warning: Failed to send invitation email to %s: %v\n", cred.email, err)
			// Continue with other emails even if one fails
		}
	}
	
	return institute, nil
}

func (s *IdentityService) GetInstitutes(query string) ([]core.Institute, error) {
	return s.repo.GetInstitutes(query)
}

type InstituteWithAdminCount struct {
	*core.Institute
	AdminCount int `json:"admin_count"`
}

func (s *IdentityService) GetInstitutesWithAdminCount(query string) ([]InstituteWithAdminCount, error) {
	institutes, err := s.repo.GetInstitutes(query)
	if err != nil {
		return nil, err
	}

	var result []InstituteWithAdminCount
	for _, institute := range institutes {
		admins, err := s.repo.GetInstituteAdmins(institute.ID.String())
		if err != nil {
			return nil, err
		}

		result = append(result, InstituteWithAdminCount{
			Institute:  &institute,
			AdminCount: len(admins),
		})
	}

	return result, nil
}

func (s *IdentityService) GetInstitute(id string) (*InstituteWithAdminsResponse, error) {
	institute, err := s.repo.GetInstituteByID(id)
	if err != nil {
		return nil, err
	}

	admins, err := s.repo.GetInstituteAdmins(id)
	if err != nil {
		return nil, err
	}

	var adminResponse []InstituteAdmin
	for _, admin := range admins {
		adminResponse = append(adminResponse, InstituteAdmin{
			ID:     admin.ID.String(),
			UserID: admin.ID.String(),
			Name:   admin.FullName,
			Email:  admin.Email,
			Role:   "ADMIN", // For now, we'll assume all are admins. Could be enhanced later
		})
	}

	return &InstituteWithAdminsResponse{
		Institute: institute,
		Admins:    adminResponse,
	}, nil
}

func (s *IdentityService) ActivateInstitute(id string) (*core.Institute, error) {
	inst, err := s.repo.GetInstituteByID(id)
	if err != nil {
		return nil, err
	}
	inst.IsActive = true
	if err := s.repo.UpdateInstitute(inst); err != nil {
		return nil, err
	}
	return inst, nil
}

func (s *IdentityService) DeactivateInstitute(id string) (*core.Institute, error) {
	inst, err := s.repo.GetInstituteByID(id)
	if err != nil {
		return nil, err
	}
	inst.IsActive = false
	if err := s.repo.UpdateInstitute(inst); err != nil {
		return nil, err
	}
	return inst, nil
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

func (s *IdentityService) AddInstituteAdmin(instituteId, name, email, role string) error {
	// First check if institute exists
	institute, err := s.repo.GetInstituteByID(instituteId)
	if err != nil {
		return err
	}
	
	// Check if user with this email already exists
	existingUser, err := s.repo.GetUserByEmail(email)
	var userId string
	var tempPassword string
	var isNewUser bool
	
	if err != nil {
		// User doesn't exist, create new user with temporary password
		// Generate a random temporary password
		tokenBytes := make([]byte, 16)
		if _, err := rand.Read(tokenBytes); err != nil {
			return fmt.Errorf("failed to generate temporary password: %w", err)
		}
		tempPassword = hex.EncodeToString(tokenBytes)[:12] + "!" // 12 chars + special char
		
		createUserReq := CreateUserRequest{
			FullName:    name,
			Email:       email,
			Password:    tempPassword,
			UserType:    core.UserTypeInstituteAdmin,
			InstituteID: instituteId,
		}
		
		newUser, err := s.RegisterUser(createUserReq)
		if err != nil {
			return err
		}
		userId = newUser.ID.String()
		isNewUser = true
		
		// Set RequiresPasswordChange flag for new admin
		newUser.RequiresPasswordChange = true
		if err := s.repo.UpdateUser(newUser); err != nil {
			fmt.Printf("[Identity] Warning: Failed to set password change requirement: %v\n", err)
		}
	} else {
		// User exists, use existing user ID
		userId = existingUser.ID.String()
		isNewUser = false
	}
	
	// Add admin relationship
	if err := s.repo.AddInstituteAdmin(instituteId, userId, role); err != nil {
		return err
	}
	
	// Send invitation email
	if err := s.sendAdminInvitationEmail(institute, name, email, tempPassword, isNewUser); err != nil {
		fmt.Printf("[Identity] Warning: Failed to send invitation email to %s: %v\n", email, err)
		// Don't fail the admin creation if email fails
	}
	
	return nil
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

// sendAdminInvitationEmail sends invitation email with temporary password or welcome message
func (s *IdentityService) sendAdminInvitationEmail(institute *core.Institute, adminName, adminEmail, tempPassword string, isNewUser bool) error {
	var subject, body string
	
	if isNewUser {
		// New user - send credentials and force reset URL
		subject = fmt.Sprintf("Welcome to %s - Your Admin Account", institute.Name)
		resetURL := fmt.Sprintf("%s/auth/force-reset", s.cfg.WebURL)
		
		body = fmt.Sprintf(`Hello %s,

You have been invited as an administrator for %s on GradeLoop.

Your login credentials:
Email: %s
Temporary Password: %s

Please log in and change your password immediately:
%s

Best regards,
GradeLoop Team`, adminName, institute.Name, adminEmail, tempPassword, resetURL)
	} else {
		// Existing user - just notify about new role
		subject = fmt.Sprintf("New Admin Role - %s", institute.Name)
		loginURL := fmt.Sprintf("%s/login", s.cfg.WebURL)
		
		body = fmt.Sprintf(`Hello %s,

You have been granted administrator access to %s on GradeLoop.

You can now access the institute's administrative features using your existing account.

Login here: %s

Best regards,
GradeLoop Team`, adminName, institute.Name, loginURL)
	}
	
	// Send email via Email Service
	emailPayload := map[string]string{
		"to":      adminEmail,
		"subject": subject,
		"body":    body,
	}
	
	fmt.Printf("[Identity] Sending admin invitation email to %s for institute %s\n", adminEmail, institute.Name)
	
	resp, err := s.postJson(s.cfg.EmailServiceURL+"/internal/email/send", emailPayload)
	if err != nil {
		return fmt.Errorf("failed to call email service: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		// Read error details
		var errBody map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("email service returned status %d: %v", resp.StatusCode, errBody)
	}
	
	fmt.Printf("[Identity] Admin invitation email sent successfully to %s\n", adminEmail)
	return nil
}

// HTTP client utility for calling email service
func (s *IdentityService) postJson(url string, data interface{}) (*http.Response, error) {
	payload, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Token", s.cfg.InternalToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("[Identity] HTTP POST error to %s: %v\n", url, err)
	}
	return resp, err
}
