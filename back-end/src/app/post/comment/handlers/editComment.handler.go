package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/services"
	"social-network/src/app/post/comment/validator"
	"social-network/src/models"
	"social-network/src/utils"
)

func EditCommentHandler(w http.ResponseWriter, r *http.Request) {
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

	var req dto.EditCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := validator.ValidateCommentContent(req.Content); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := services.EditComment(userCtx.ID, commentID, req.Content)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, dto.CommentActionResponse{CommentID: commentID, Action: "edited"}, "Comment updated successfully")
}
