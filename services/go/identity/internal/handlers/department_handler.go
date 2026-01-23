package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/internal/service"
	"github.com/4yrg/gradeloop-core/develop/services/go/identity/pkg/utils"
	"github.com/go-chi/chi/v5"
)

type DepartmentHandler struct {
	departmentService service.DepartmentService
}

func NewDepartmentHandler(departmentService service.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{departmentService: departmentService}
}

func (h *DepartmentHandler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	var department models.Department
	if err := json.NewDecoder(r.Body).Decode(&department); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.departmentService.CreateDepartment(&department); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create department", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "Department created successfully", department)
}

func (h *DepartmentHandler) GetDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid department ID", nil)
		return
	}

	department, err := h.departmentService.GetDepartmentByID(id)
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Department not found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", department)
}

func (h *DepartmentHandler) GetDepartmentsByFaculty(w http.ResponseWriter, r *http.Request) {
	facultyID := chi.URLParam(r, "facultyId")
	if facultyID == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid faculty ID", nil)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 10
	}

	departments, total, err := h.departmentService.GetDepartmentsByFacultyID(facultyID, limit, offset)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch departments", err)
		return
	}

	utils.SendPaginated(w, departments, total, limit, offset)
}

func (h *DepartmentHandler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid department ID", nil)
		return
	}

	var department models.Department
	if err := json.NewDecoder(r.Body).Decode(&department); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	department.ID = id

	if err := h.departmentService.UpdateDepartment(&department); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to update department", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Department updated successfully", department)
}

func (h *DepartmentHandler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid department ID", nil)
		return
	}

	if err := h.departmentService.DeleteDepartment(id); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to delete department", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Department deleted successfully", nil)
}
