package handlers

import (
	"net/http"
	"social-network/src/app/post/repost/dto"
	"social-network/src/app/post/repost/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func RepostPostHandler(w http.ResponseWriter, r *http.Request) {
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

	err := services.RepostPost(userCtx.ID, postID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, dto.PostRepostActionResponse{PostID: postID, Action: "reposted"}, "Post reposted successfully")
}
