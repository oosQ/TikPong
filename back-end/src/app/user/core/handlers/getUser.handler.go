package handlers

import (
	"net/http"
	"social-network/src/app/user/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID := r.PathValue("userId")
	if userID == "" {
		utils.SendError(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	if userID == userCtx.ID {
		utils.SendError(w, "Cannot retrieve your own user data with this endpoint", http.StatusForbidden)
		return
	}

	user, err := services.GetUser(userID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusNotFound)
		return
	}

	utils.SendSuccess(w, user, "User retrieved successfully")
}
