package handlers

import (
	"net/http"
	"social-network/src/app/user/follow/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetSentFollowRequestsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requests, err := services.GetSentFollowRequests(userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, requests, "Sent follow requests retrieved successfully")
}