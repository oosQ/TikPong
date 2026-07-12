package handlers

import (
	"net/http"
	"social-network/src/app/post/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetUserRepostedPostsHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID := ""
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if ok && userCtx != nil {
		currentUserID = userCtx.ID
	}

	userID := r.PathValue("userId")
	if userID == "" {
		utils.SendError(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	posts, err := services.GetUserRepostedPosts(userID, currentUserID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, posts, "User reposted posts retrieved successfully")
}
