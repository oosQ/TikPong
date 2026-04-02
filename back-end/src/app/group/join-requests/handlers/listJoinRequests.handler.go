package handlers

import (
	"net/http"
	"social-network/src/app/group/join-requests/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func ListJoinRequestsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	if groupID == "" {
		utils.SendError(w, "Missing groupId parameter", http.StatusBadRequest)
		return
	}

	joinRequests, err := services.ListJoinRequests(groupID, userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, joinRequests, "Join requests retrieved successfully")
}
