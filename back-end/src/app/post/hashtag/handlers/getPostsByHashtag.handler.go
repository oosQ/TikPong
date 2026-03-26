package handlers

import (
	"net/http"
	"social-network/src/app/post/hashtag/services"
	"social-network/src/utils"
)

func GetPostsByHashtagHandler(w http.ResponseWriter, r *http.Request) {
	hashtagID := r.PathValue("hashtagId")
	if hashtagID == "" {
		utils.SendError(w, "Missing hashtagId parameter", http.StatusBadRequest)
		return
	}

	posts, err := services.GetPostsByHashtag(hashtagID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, posts, "Posts retrieved successfully")
}
