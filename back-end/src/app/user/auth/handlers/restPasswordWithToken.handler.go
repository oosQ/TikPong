package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/user/auth/dto"
	"social-network/src/app/user/auth/services"
	"social-network/src/app/user/auth/validator"
	"social-network/src/utils"
	"social-network/src/middleware"
)

func ResetPasswordWithTokenHandler(w http.ResponseWriter, r *http.Request) {
    if middleware.GetCurrentUser(r) != nil {
		utils.SendError(w, "Already authenticated", http.StatusForbidden)
		return
	}

	var req dto.ResetPasswordRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var token = r.URL.Query().Get("token")
	if token == "" {
		utils.SendError(w, "Missing token", http.StatusBadRequest)
		return
	}
	if err := validator.ValidateChangePassword(req.ConfirmPassword, req.NewPassword); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = services.ResetPasswordWithToken(token, req.NewPassword)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, nil, "Password reset successfully")
}
