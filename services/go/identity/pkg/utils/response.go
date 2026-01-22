package utils

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Total   int64       `json:"total"`
	Limit   int         `json:"limit"`
	Offset  int         `json:"offset"`
}

func SendJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func SendSuccess(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	SendJSON(w, statusCode, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func SendError(w http.ResponseWriter, statusCode int, message string, err error) {
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}
	SendJSON(w, statusCode, Response{
		Success: false,
		Message: message,
		Error:   errMsg,
	})
}

func SendPaginated(w http.ResponseWriter, data interface{}, total int64, limit, offset int) {
	SendJSON(w, http.StatusOK, PaginatedResponse{
		Success: true,
		Data:    data,
		Total:   total,
		Limit:   limit,
		Offset:  offset,
	})
}
