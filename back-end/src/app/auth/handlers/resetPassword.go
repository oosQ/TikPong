package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/auth/dto"
	"social-network/src/models"
	"social-network/src/app/auth/validator"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
)


func ResetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var req dto.ResetPasswordRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
   
	if err := validator.ValidateResetPassword(req.ConfirmPassword, req.NewPassword); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = services.ResetPassword(userCtx.ID,req.NewPassword)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
  

	utils.SendSuccess(w, nil, "Password reset successfully")
}