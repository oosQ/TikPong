package handlers

import (
	"net/http"
	"social-network/src/app/user/follow/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func AcceptFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	fromUserID := r.PathValue("userId")
	if fromUserID == "" {
		utils.SendError(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	err := services.AcceptFollowRequest(fromUserID, userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Follow request accepted")
}