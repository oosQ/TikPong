package handlers

import (
	"net/http"
	"social-network/src/app/user/follow/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func FollowUserHandler(w http.ResponseWriter, r *http.Request) {
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

	err := services.FollowUser(userCtx.ID, userID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "User followed successfully")
}
