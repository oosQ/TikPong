package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/user/auth/dto"
	"social-network/src/models"
	"social-network/src/app/user/auth/validator"
	"social-network/src/app/user/auth/services"
	"social-network/src/utils"
)


func ChangePasswordHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var req dto.ChangePasswordRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
   
	if err := validator.ValidateChangePassword(req.ConfirmPassword, req.NewPassword); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = services.ChangePassword(userCtx.ID,req.NewPassword)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
  

	utils.SendSuccess(w, nil, "Password reset successfully")
}