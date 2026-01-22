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

type FacultyHandler struct {
	facultyService service.FacultyService
}

func NewFacultyHandler(facultyService service.FacultyService) *FacultyHandler {
	return &FacultyHandler{facultyService: facultyService}
}

func (h *FacultyHandler) CreateFaculty(w http.ResponseWriter, r *http.Request) {
	var faculty models.Faculty
	if err := json.NewDecoder(r.Body).Decode(&faculty); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.facultyService.CreateFaculty(&faculty); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create faculty", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "Faculty created successfully", faculty)
}

func (h *FacultyHandler) GetFaculty(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid faculty ID", err)
		return
	}

	faculty, err := h.facultyService.GetFacultyByID(uint(id))
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Faculty not found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", faculty)
}

func (h *FacultyHandler) GetFacultiesByInstitute(w http.ResponseWriter, r *http.Request) {
	instituteIDStr := chi.URLParam(r, "instituteId")
	instituteID, err := strconv.ParseUint(instituteIDStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid institute ID", err)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 10
	}

	faculties, total, err := h.facultyService.GetFacultiesByInstituteID(uint(instituteID), limit, offset)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch faculties", err)
		return
	}

	utils.SendPaginated(w, faculties, total, limit, offset)
}

func (h *FacultyHandler) UpdateFaculty(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid faculty ID", err)
		return
	}

	var faculty models.Faculty
	if err := json.NewDecoder(r.Body).Decode(&faculty); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	faculty.ID = uint(id)

	if err := h.facultyService.UpdateFaculty(&faculty); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to update faculty", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Faculty updated successfully", faculty)
}

func (h *FacultyHandler) DeleteFaculty(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid faculty ID", err)
		return
	}

	if err := h.facultyService.DeleteFaculty(uint(id)); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to delete faculty", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Faculty deleted successfully", nil)
}
