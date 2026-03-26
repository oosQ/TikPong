package handlers

import (
	"net/http"
	"social-network/src/app/post/comment/services"
	"social-network/src/utils"
)

func GetUserCommentsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("userId")
	if userID == "" {
		utils.SendError(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	comments, err := services.GetUserComments(userID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, comments, "User comments retrieved successfully")
}
