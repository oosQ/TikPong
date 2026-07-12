package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/user/core/dto"
	"social-network/src/app/user/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func EditUserHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req dto.EditUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := services.EditUser(userCtx.ID, req); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "nickname already exists" {
			statusCode = http.StatusConflict
		}
		utils.SendError(w, err.Error(), statusCode)
		return
	}

	utils.SendSuccess(w, nil, "User updated successfully")
}
