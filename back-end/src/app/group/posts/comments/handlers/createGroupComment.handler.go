package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"social-network/src/app/group/posts/comments/dto"
	"social-network/src/app/group/posts/comments/services"
	"social-network/src/models"
	"social-network/src/utils"
	"strings"
)

func CreateGroupCommentHandler(w http.ResponseWriter, r *http.Request) {
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

	var req dto.CreateGroupCommentRequest
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

	commentID, err := services.CreateGroupComment(groupID, postID, userCtx.ID, req.Content, req.ImagePath)
	if err != nil {
		if req.ImagePath != "" {
			_ = os.Remove(req.ImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, map[string]string{"comment_id": commentID}, "Group comment created successfully")
}
