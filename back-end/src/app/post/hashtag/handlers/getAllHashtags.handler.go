package handlers

import (
	"net/http"
	"social-network/src/app/post/hashtag/services"
	"social-network/src/utils"
)

func GetAllHashtagsHandler(w http.ResponseWriter, r *http.Request) {
	hashtags, err := services.GetAllHashtags()
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, hashtags, "Hashtags retrieved successfully")
}
