package handlers

import (
	"net/http"
	"social-network/src/app/post/hashtag/services"
	"social-network/src/utils"
)

func GetAllHashtagsHandler(w http.ResponseWriter, r *http.Request) {
	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	hashtags, err := services.GetAllHashtags(cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, hashtags, "Hashtags retrieved successfully")
}
