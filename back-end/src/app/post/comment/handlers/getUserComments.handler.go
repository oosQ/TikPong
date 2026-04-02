package handlers

import (
	"net/http"
	"social-network/src/app/post/comment/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetUserCommentsHandler(w http.ResponseWriter, r *http.Request) {
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

	comments, err := services.GetUserComments(userID, userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, comments, "User comments retrieved successfully")
}
