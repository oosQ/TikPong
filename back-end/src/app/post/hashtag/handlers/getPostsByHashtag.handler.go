package handlers

import (
	"net/http"
	"social-network/src/app/post/hashtag/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetPostsByHashtagHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID := ""
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if ok && userCtx != nil {
		currentUserID = userCtx.ID
	}

	hashtagID := r.PathValue("hashtagId")
	if hashtagID == "" {
		utils.SendError(w, "Missing hashtagId parameter", http.StatusBadRequest)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	posts, err := services.GetPostsByHashtag(hashtagID, currentUserID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, posts, "Posts retrieved successfully")
}
