package handlers

import (
	"net/http"
	"social-network/src/app/post/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetPostHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID := ""
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if ok && userCtx != nil {
		currentUserID = userCtx.ID
	}

	postID := r.PathValue("postId")
	if postID == "" {
		utils.SendError(w, "Missing postId parameter", http.StatusBadRequest)
		return
	}

	post, err := services.GetPost(postID, currentUserID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, post, "Post retrieved successfully")
}
