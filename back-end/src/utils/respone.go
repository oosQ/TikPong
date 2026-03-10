package utils

import (
	"encoding/json"
	"net/http"
)
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    any `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    int    `json:"code"`
}


func SendJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}


func SendSuccess(w http.ResponseWriter, data any, message string) {
	response := SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	}
	SendJSON(w, response, http.StatusOK)
}


func SendError(w http.ResponseWriter, message string, statusCode int) {
	response := ErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}
	SendJSON(w, response, statusCode)
}
