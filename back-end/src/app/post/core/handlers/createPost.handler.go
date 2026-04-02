package handlers

import (
	"fmt"
	"net/http"
	"os"
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/services"
	"social-network/src/app/post/core/validator"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
    userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var postReq dto.CreatePostRequest

	postReq.Title = r.FormValue("title")
	postReq.Content = r.FormValue("content")
	postReq.Privacy = r.FormValue("privacy")
	postReq.ImagePath = r.FormValue("image_path")
	postReq.Hashtags = r.Form["hashtags"]
	postReq.AllowedViewers = r.Form["allowed_viewers"]
	fmt.Printf("Received post creation request: %+v\n", postReq.Hashtags)
	uploadedImagePath, err := utils.SaveUploadedPostImage(r)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	if uploadedImagePath != "" {
		postReq.ImagePath = uploadedImagePath
	}

	if err := validator.ValidateCreatePost(postReq); err != nil {
		if uploadedImagePath != "" {
			os.Remove(uploadedImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err, postID := services.CreatePost(userCtx.ID, postReq)
	if err != nil {
		if uploadedImagePath != "" {
			os.Remove(uploadedImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, map[string]string{"post_id": postID}, "Post created successfully")
}

