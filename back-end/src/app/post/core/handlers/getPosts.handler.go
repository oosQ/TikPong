package handlers

import (
	"net/http"
	"social-network/src/app/post/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID := ""
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if ok && userCtx != nil {
		currentUserID = userCtx.ID
	}

	posts, err := services.GetPosts(currentUserID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, posts, "Posts retrieved successfully")
}
