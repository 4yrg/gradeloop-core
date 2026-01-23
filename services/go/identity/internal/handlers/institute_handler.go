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

type InstituteHandler struct {
	instituteService service.InstituteService
}

func NewInstituteHandler(instituteService service.InstituteService) *InstituteHandler {
	return &InstituteHandler{instituteService: instituteService}
}

func (h *InstituteHandler) CreateInstitute(w http.ResponseWriter, r *http.Request) {
	var institute models.Institute
	if err := json.NewDecoder(r.Body).Decode(&institute); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.instituteService.CreateInstitute(&institute); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create institute", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "Institute created successfully", institute)
}

func (h *InstituteHandler) GetInstitute(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid institute ID", nil)
		return
	}

	institute, err := h.instituteService.GetInstituteByID(id)
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Institute not found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", institute)
}

func (h *InstituteHandler) GetAllInstitutes(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 10
	}

	institutes, total, err := h.instituteService.GetAllInstitutes(limit, offset)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch institutes", err)
		return
	}

	utils.SendPaginated(w, institutes, total, limit, offset)
}

func (h *InstituteHandler) UpdateInstitute(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid institute ID", nil)
		return
	}

	var institute models.Institute
	if err := json.NewDecoder(r.Body).Decode(&institute); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	institute.ID = id

	if err := h.instituteService.UpdateInstitute(&institute); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to update institute", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Institute updated successfully", institute)
}

func (h *InstituteHandler) DeleteInstitute(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid institute ID", nil)
		return
	}

	if err := h.instituteService.DeleteInstitute(id); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to delete institute", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Institute deleted successfully", nil)
}
