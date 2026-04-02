package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/services"
	"social-network/src/app/post/comment/validator"
	"social-network/src/models"
	"social-network/src/utils"
	"strings"
)

func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
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

	var req dto.CreateCommentRequest
	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		req.Content = r.FormValue("content")
		uploadedImagePath, err := utils.SaveUploadedCommentImage(r)
		if err != nil {
			utils.SendError(w, err.Error(), http.StatusBadRequest)
			return
		}
		req.ImagePath = uploadedImagePath
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.SendError(w, "Invalid request body", http.StatusBadRequest)
			return
		}
	}

	if err := validator.ValidateCommentContent(req.Content); err != nil {
		if req.ImagePath != "" {
			_ = os.Remove(req.ImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	commentID, err := services.CreateComment(userCtx.ID, postID, req.Content, req.ImagePath)
	if err != nil {
		if req.ImagePath != "" {
			_ = os.Remove(req.ImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, dto.CommentActionResponse{CommentID: commentID, Action: "created"}, "Comment created successfully")
}