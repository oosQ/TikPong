package handlers

import (
	"net/http"
	"os"
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/services"
	"social-network/src/app/post/core/validator"
	"social-network/src/models"
	"social-network/src/utils"
)

func EditPostHandler(w http.ResponseWriter, r *http.Request) {
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

	var req dto.EditPostRequest
	req.Title = r.FormValue("title")
	req.Content = r.FormValue("content")
	req.Privacy = r.FormValue("privacy")
	req.Hashtags = r.Form["hashtags"]
	req.AllowedViewers = r.Form["allowed_viewers"]

	uploadedImagePath, err := utils.SaveUploadedPostImage(r)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	if uploadedImagePath != "" {
		req.ImagePath = uploadedImagePath
	} else {
		req.ImagePath = r.FormValue("image_path")
	}

	if err := validator.ValidateEditPost(req); err != nil {
		if uploadedImagePath != "" {
			os.Remove(uploadedImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = services.EditPost(userCtx.ID, postID, req)
	if err != nil {
		if uploadedImagePath != "" {
			os.Remove(uploadedImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Post updated successfully")
}
