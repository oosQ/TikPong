package handlers

import (
	"net/http"
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func DeleteCommentHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	commentID := r.PathValue("commentId")
	if commentID == "" {
		utils.SendError(w, "Missing commentId parameter", http.StatusBadRequest)
		return
	}

	err := services.DeleteComment(userCtx.ID, commentID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, dto.CommentActionResponse{CommentID: commentID, Action: "deleted"}, "Comment deleted successfully")
}
