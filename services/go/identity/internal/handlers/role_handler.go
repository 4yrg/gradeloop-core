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

type RoleHandler struct {
	roleService service.RoleService
}

func NewRoleHandler(roleService service.RoleService) *RoleHandler {
	return &RoleHandler{roleService: roleService}
}

func (h *RoleHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var role models.Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.roleService.CreateRole(&role); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create role", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "Role created successfully", role)
}

func (h *RoleHandler) GetRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid role ID", nil)
		return
	}

	role, err := h.roleService.GetRoleByID(id)
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "Role not found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", role)
}

func (h *RoleHandler) GetAllRoles(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 10
	}

	roles, total, err := h.roleService.GetAllRoles(limit, offset)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch roles", err)
		return
	}

	utils.SendPaginated(w, roles, total, limit, offset)
}

func (h *RoleHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid role ID", nil)
		return
	}

	var role models.Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	role.ID = id

	if err := h.roleService.UpdateRole(&role); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to update role", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Role updated successfully", role)
}

func (h *RoleHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.SendError(w, http.StatusBadRequest, "Invalid role ID", nil)
		return
	}

	if err := h.roleService.DeleteRole(id); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to delete role", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Role deleted successfully", nil)
}
