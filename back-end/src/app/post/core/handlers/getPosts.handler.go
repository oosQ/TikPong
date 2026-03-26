package handlers

import (
	"net/http"
	"social-network/src/app/post/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetPostsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	posts, err := services.GetPosts(userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, posts, "Posts retrieved successfully")
}
