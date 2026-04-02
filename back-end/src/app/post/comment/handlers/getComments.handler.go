package handlers

import (
	"net/http"
	"social-network/src/app/post/comment/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
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

	comments, err := services.GetComments(currentUserID, postID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, comments, "Comments retrieved successfully")
}
