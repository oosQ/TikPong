package handlers

import (
	"net/http"
	"social-network/src/app/group/posts/likes/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreateGroupPostLikeHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	groupID := r.PathValue("groupId")
	postID := r.PathValue("postId")

	if groupID == "" || postID == "" {
		utils.SendError(w, "Missing required path params", http.StatusBadRequest)
		return
	}

	if err := services.CreateGroupPostLike(groupID, postID, userCtx.ID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Post liked successfully")
}
