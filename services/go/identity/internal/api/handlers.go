package api

import (
	"github.com/4yrg/gradeloop-core/services/go/identity/internal/service"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	svc *service.IdentityService
}

func NewHandler(svc *service.IdentityService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) ConfirmUserEmail(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.ConfirmUserEmail(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusOK)
}

func (h *Handler) RegisterUser(c *fiber.Ctx) error {
	var req service.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	user, err := h.svc.RegisterUser(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *Handler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	user, err := h.svc.GetUser(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}
	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *Handler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	type Req struct {
		FullName string `json:"full_name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	user, err := h.svc.UpdateUser(id, req.FullName)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(user)
}

func (h *Handler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteUser(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) ListUsers(c *fiber.Ctx) error {
	// Simple pagination
	offset := 0
	limit := 10
	users, err := h.svc.ListUsers(offset, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(users)
}

func (h *Handler) LookupUser(c *fiber.Ctx) error {
	type Req struct {
		Email string `json:"email"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	user, err := h.svc.LookupUser(req.Email)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}
	return c.JSON(user)
}

func (h *Handler) GetUserEnrollments(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	enrollments, err := h.svc.GetUserEnrollments(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(enrollments)
}

func (h *Handler) ValidateCredentials(c *fiber.Ctx) error {
	// Passwordless auth - this endpoint returns 401/invalid always
	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"valid": false, "error": "password authentication disabled"})
}

// UpdateCredentials handler removed

func (h *Handler) GetUserRole(c *fiber.Ctx) error {
	id := c.Params("id")
	role, err := h.svc.GetUserRole(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}
	return c.JSON(fiber.Map{"role": role})
}

// -- Organization Handlers --

func (h *Handler) CreateInstitute(c *fiber.Ctx) error {
	var req service.CreateInstituteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	inst, err := h.svc.CreateInstitute(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(inst)
}

func (h *Handler) GetInstitutes(c *fiber.Ctx) error {
	query := c.Query("q")
	list, err := h.svc.GetInstitutesWithAdminCount(query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(list)
}

func (h *Handler) GetInstitute(c *fiber.Ctx) error {
	id := c.Params("id")
	inst, err := h.svc.GetInstitute(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(inst)
}

func (h *Handler) ActivateInstitute(c *fiber.Ctx) error {
	id := c.Params("id")
	inst, err := h.svc.ActivateInstitute(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(inst)
}

func (h *Handler) DeactivateInstitute(c *fiber.Ctx) error {
	id := c.Params("id")
	inst, err := h.svc.DeactivateInstitute(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(inst)
}

func (h *Handler) CreateFaculty(c *fiber.Ctx) error {
	type Req struct {
		InstituteID string `json:"institute_id"`
		Name        string `json:"name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	fac, err := h.svc.CreateFaculty(req.InstituteID, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fac)
}

func (h *Handler) CreateDepartment(c *fiber.Ctx) error {
	type Req struct {
		FacultyID string `json:"faculty_id"`
		Name      string `json:"name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	dept, err := h.svc.CreateDepartment(req.FacultyID, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(dept)
}

func (h *Handler) CreateClass(c *fiber.Ctx) error {
	type Req struct {
		DepartmentID string `json:"department_id"`
		Name         string `json:"name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	class, err := h.svc.CreateClass(req.DepartmentID, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(class)
}

func (h *Handler) EnrollStudent(c *fiber.Ctx) error {
	classID := c.Params("class_id")
	type Req struct {
		StudentID string `json:"student_id"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	if err := h.svc.EnrollStudent(classID, req.StudentID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusCreated)
}

func (h *Handler) GetClassEnrollments(c *fiber.Ctx) error {
	classID := c.Params("class_id")
	enrollments, err := h.svc.GetClassEnrollments(classID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(enrollments)
}

func (h *Handler) UnenrollStudent(c *fiber.Ctx) error {
	classID := c.Params("class_id")
	studentID := c.Params("student_id")
	if err := h.svc.UnenrollStudent(classID, studentID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// -- Org Update/Delete Handlers --

func (h *Handler) UpdateInstitute(c *fiber.Ctx) error {
	id := c.Params("id")
	type Req struct {
		Name string `json:"name"`
		Code string `json:"code"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	inst, err := h.svc.UpdateInstitute(id, req.Name, req.Code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(inst)
}

func (h *Handler) DeleteInstitute(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteInstitute(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) AddInstituteAdmin(c *fiber.Ctx) error {
	instituteId := c.Params("id")

	type AddAdminRequest struct {
		Name  string `json:"name" validate:"required"`
		Email string `json:"email" validate:"required,email"`
		Role  string `json:"role" validate:"required,oneof=OWNER ADMIN"`
	}

	var req AddAdminRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	if err := h.svc.AddInstituteAdmin(instituteId, req.Name, req.Email, req.Role); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Admin added successfully"})
}

func (h *Handler) RemoveInstituteAdmin(c *fiber.Ctx) error {
	instituteId := c.Params("id")
	adminId := c.Params("adminId")

	if err := h.svc.RemoveInstituteAdmin(instituteId, adminId); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Admin removed successfully"})
}

func (h *Handler) ResendAdminInvite(c *fiber.Ctx) error {
	instituteId := c.Params("id")
	adminId := c.Params("adminId")

	if err := h.svc.ResendAdminInvite(instituteId, adminId); err != nil {
		// Check if it's a business logic error that should return 400
		if err.Error() == "admin has already activated their account" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Invitation resent successfully"})
}

// Similar for Faculty, Dept, Class...
func (h *Handler) UpdateFaculty(c *fiber.Ctx) error {
	id := c.Params("id")
	type Req struct {
		Name string `json:"name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	fac, err := h.svc.UpdateFaculty(id, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fac)
}

func (h *Handler) DeleteFaculty(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteFaculty(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) UpdateDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	type Req struct {
		Name string `json:"name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	dept, err := h.svc.UpdateDepartment(id, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(dept)
}

func (h *Handler) DeleteDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteDepartment(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) UpdateClass(c *fiber.Ctx) error {
	id := c.Params("id")
	type Req struct {
		Name string `json:"name"`
	}
	var req Req
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	class, err := h.svc.UpdateClass(id, req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(class)
}

func (h *Handler) DeleteClass(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteClass(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) GetFaculty(c *fiber.Ctx) error {
	id := c.Params("id")
	fac, err := h.svc.GetFaculty(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fac)
}

func (h *Handler) GetDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	dept, err := h.svc.GetDepartment(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(dept)
}

func (h *Handler) GetClass(c *fiber.Ctx) error {
	id := c.Params("id")
	class, err := h.svc.GetClass(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(class)
}
