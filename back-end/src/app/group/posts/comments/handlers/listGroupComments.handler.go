package handlers

import (
	"net/http"
	"social-network/src/app/group/posts/comments/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func ListGroupCommentsHandler(w http.ResponseWriter, r *http.Request) {
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

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	items, err := services.ListGroupComments(groupID, postID, userCtx.ID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, items, "Group comments retrieved successfully")
}
