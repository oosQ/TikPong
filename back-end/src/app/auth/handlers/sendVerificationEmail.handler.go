package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/auth/dto"
	"social-network/src/app/auth/services"
	"social-network/src/app/auth/validator"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func SendVerificationEmailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if middleware.GetCurrentUser(r) == nil {
		utils.SendError(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	var email dto.SendVerificationEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&email); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := validator.ValidateEmail(email.Email); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := services.SendVerificationEmail(email.Email)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, nil, "Verification email sent")
}
