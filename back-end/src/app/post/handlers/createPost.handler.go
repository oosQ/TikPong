package handlers

import (
	"fmt"
	"net/http"
	"os"
	"social-network/src/app/post/dto"
	"social-network/src/app/post/services"
	"social-network/src/app/post/validator"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation for creating a post will go here
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
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
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Call the service to create the post
	err = services.CreatePost(userCtx.ID, postReq)
	if err != nil {
		if uploadedImagePath != "" {
			os.Remove(uploadedImagePath)
		}
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, nil, "Post created successfully")
}

