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

type MembershipHandler struct {
	membershipService service.MembershipService
}

func NewMembershipHandler(membershipService service.MembershipService) *MembershipHandler {
	return &MembershipHandler{membershipService: membershipService}
}

func (h *MembershipHandler) CreateMembership(w http.ResponseWriter, r *http.Request) {
	var membership models.StudentMembership
	if err := json.NewDecoder(r.Body).Decode(&membership); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.membershipService.CreateMembership(&membership); err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to create membership", err)
		return
	}

	utils.SendSuccess(w, http.StatusCreated, "Membership created successfully", membership)
}

func (h *MembershipHandler) GetMembershipsByStudent(w http.ResponseWriter, r *http.Request) {
	studentIDStr := chi.URLParam(r, "studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid student ID", err)
		return
	}

	memberships, err := h.membershipService.GetMembershipsByStudentID(uint(studentID))
	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to fetch memberships", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", memberships)
}

func (h *MembershipHandler) GetCurrentMembership(w http.ResponseWriter, r *http.Request) {
	studentIDStr := chi.URLParam(r, "studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid student ID", err)
		return
	}

	membership, err := h.membershipService.GetCurrentMembershipByStudentID(uint(studentID))
	if err != nil {
		utils.SendError(w, http.StatusNotFound, "No current membership found", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "", membership)
}

type TransferStudentRequest struct {
	NewFacultyID    uint `json:"new_faculty_id" validate:"required"`
	NewDepartmentID uint `json:"new_department_id" validate:"required"`
	NewClassID      uint `json:"new_class_id" validate:"required"`
}

func (h *MembershipHandler) TransferStudent(w http.ResponseWriter, r *http.Request) {
	studentIDStr := chi.URLParam(r, "studentId")
	studentID, err := strconv.ParseUint(studentIDStr, 10, 32)
	if err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid student ID", err)
		return
	}

	var req TransferStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	err = h.membershipService.TransferStudent(
		uint(studentID),
		req.NewFacultyID,
		req.NewDepartmentID,
		req.NewClassID,
	)

	if err != nil {
		utils.SendError(w, http.StatusInternalServerError, "Failed to transfer student", err)
		return
	}

	utils.SendSuccess(w, http.StatusOK, "Student transferred successfully", nil)
}
