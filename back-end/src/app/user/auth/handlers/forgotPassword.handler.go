package handlers

import (
	"net/http"
	"social-network/src/app/user/auth/dto"
	"social-network/src/app/user/auth/services"
	"social-network/src/utils"
	"encoding/json"
	"social-network/src/middleware"
)

func ForgotPasswordHandler(w http.ResponseWriter, r *http.Request) {
    if middleware.GetCurrentUser(r) != nil {
		utils.SendError(w, "Already authenticated", http.StatusForbidden)
		return
	}

	var req dto.ForgotPasswordRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = services.ForgotPassword(req.Email)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, nil, "Password reset email sent successfully")
}