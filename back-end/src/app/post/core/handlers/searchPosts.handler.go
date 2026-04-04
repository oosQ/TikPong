package handlers

import (
	"net/http"
	"social-network/src/app/post/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func SearchPostsHandler(w http.ResponseWriter, r *http.Request) {
	var currentUserID string
	if userCtx, ok := r.Context().Value("user_data").(*models.UserContext); ok && userCtx != nil {
		currentUserID = userCtx.ID
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		utils.SendError(w, "Missing required query parameter: q", http.StatusBadRequest)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	result, err := services.SearchPosts(currentUserID, query, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, result, "Posts found successfully")
}
