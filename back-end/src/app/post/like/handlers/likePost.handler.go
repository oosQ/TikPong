package handlers

import (
	"net/http"
	"social-network/src/app/post/like/dto"
	"social-network/src/app/post/like/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func LikePostHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postID := r.PathValue("postId")
	if postID == "" {
		utils.SendError(w, "Missing postId parameter", http.StatusBadRequest)
		return
	}

	err := services.LikePost(userCtx.ID, postID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, dto.PostLikeActionResponse{PostID: postID, Action: "liked"}, "Post liked successfully")
}
