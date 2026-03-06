package utils

import (
	"encoding/json"
	"social-network/src/dto"
	"net/http"
)


func SendJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}


func SendSuccess(w http.ResponseWriter, data any, message string) {
	response := dto.SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	}
	SendJSON(w, response, http.StatusOK)
}


func SendError(w http.ResponseWriter, message string, statusCode int) {
	response := dto.ErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}
	SendJSON(w, response, statusCode)
}
