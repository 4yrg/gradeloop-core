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

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.userService.CreateUser(&user); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "User created successfully", user)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "User not found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", user)
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit == 0 {
		limit = 10
	}

	users, total, err := h.userService.GetAllUsers(limit, offset)
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch users", err)
		return
	}

	utils.SendPaginated(w, users, total, limit, offset)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	user.ID = uint(id)

	if err := h.userService.UpdateUser(&user); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to update user", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "User updated successfully", user)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	if err := h.userService.DeleteUser(uint(id)); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to delete user", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "User deleted successfully", nil)
}

type AssignRolesRequest struct {
	RoleIDs []uint `json:"role_ids" validate:"required"`
}

func (h *UserHandler) AssignRoles(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	var req AssignRolesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.userService.AssignRolesToUser(uint(id), req.RoleIDs); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to assign roles", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Roles assigned successfully", nil)
}
