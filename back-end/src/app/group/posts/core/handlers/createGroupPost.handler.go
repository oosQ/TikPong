package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"social-network/src/app/group/posts/core/dto"
	"social-network/src/app/group/posts/core/services"
	"social-network/src/models"
	"social-network/src/utils"
	"strings"
)

func CreateGroupPostHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	if groupID == "" {
		utils.SendError(w, "Missing groupId parameter", http.StatusBadRequest)
		return
	}

	var req dto.CreateGroupPostRequest
	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		req.Title = r.FormValue("title")
		req.Content = r.FormValue("content")
		uploadedImagePath, err := utils.SaveUploadedPostImage(r)
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

	postID, err := services.CreateGroupPost(groupID, userCtx.ID, req)
	if err != nil {
		if req.ImagePath != "" {
			_ = os.Remove(req.ImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, map[string]string{"post_id": postID}, "Group post created successfully")
}
