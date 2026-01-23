package http

import (
	"encoding/json"
	"net/http"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/repository"
	"github.com/go-chi/chi/v5"
)

type AdminHandler struct {
	policyRepo repository.PolicyRepository
	roleRepo   repository.RoleRepository
}

func NewAdminHandler(p repository.PolicyRepository, r repository.RoleRepository) *AdminHandler {
	return &AdminHandler{
		policyRepo: p,
		roleRepo:   r,
	}
}

func (h *AdminHandler) Routes() chi.Router {
	r := chi.NewRouter()

	r.Route("/api/v1/authz", func(r chi.Router) {
		r.Get("/roles", h.ListRoles)
		r.Post("/roles", h.CreateRole)
		r.Get("/policies", h.ListPolicies)
		r.Post("/policies", h.CreatePolicy)
	})

	return r
}

func (h *AdminHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	roles, err := h.roleRepo.FindAll(r.Context(), tenantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(roles)
}

func (h *AdminHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var role models.Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.roleRepo.Create(r.Context(), &role); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(role)
}

func (h *AdminHandler) ListPolicies(w http.ResponseWriter, r *http.Request) {
	policies, err := h.policyRepo.FindAll(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(policies)
}

func (h *AdminHandler) CreatePolicy(w http.ResponseWriter, r *http.Request) {
	var policy models.Policy
	if err := json.NewDecoder(r.Body).Decode(&policy); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.policyRepo.Create(r.Context(), &policy); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(policy)
}
