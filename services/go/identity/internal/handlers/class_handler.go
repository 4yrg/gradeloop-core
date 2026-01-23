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

type ClassHandler struct {
	classService service.ClassService
}

func NewClassHandler(classService service.ClassService) *ClassHandler {
	return &ClassHandler{classService: classService}
}

func (h *ClassHandler) CreateClass(w http.ResponseWriter, r *http.Request) {
	var class models.Class
	if err := json.NewDecoder(r.Body).Decode(&class); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.classService.CreateClass(&class); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create class", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "Class created successfully", class)
}

func (h *ClassHandler) GetClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid class ID", nil)
		return
	}

	class, err := h.classService.GetClassByID(id)
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Class not found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", class)
}

func (h *ClassHandler) GetClassesByDepartment(w http.ResponseWriter, r *http.Request) {
	departmentID := chi.URLParam(r, "departmentId")
	if departmentID == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid department ID", nil)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 10
	}

	classes, total, err := h.classService.GetClassesByDepartmentID(departmentID, limit, offset)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch classes", err)
		return
	}

	utils.SendPaginated(w, classes, total, limit, offset)
}

func (h *ClassHandler) UpdateClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid class ID", nil)
		return
	}

	var class models.Class
	if err := json.NewDecoder(r.Body).Decode(&class); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	class.ID = id

	if err := h.classService.UpdateClass(&class); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to update class", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Class updated successfully", class)
}

func (h *ClassHandler) DeleteClass(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid class ID", nil)
		return
	}

	if err := h.classService.DeleteClass(id); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to delete class", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Class deleted successfully", nil)
}
