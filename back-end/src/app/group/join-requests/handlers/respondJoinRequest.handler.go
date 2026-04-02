package handlers

import (
	"net/http"
	"social-network/src/app/group/join-requests/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func AcceptJoinRequestHandler(w http.ResponseWriter, r *http.Request) {
	respondJoinRequestHandler(w, r, "accepted")
}

func RejectJoinRequestHandler(w http.ResponseWriter, r *http.Request) {
	respondJoinRequestHandler(w, r, "rejected")
}

func respondJoinRequestHandler(w http.ResponseWriter, r *http.Request, status string) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	requesterID := r.PathValue("userId")
	if groupID == "" || requesterID == "" {
		utils.SendError(w, "Missing required path params", http.StatusBadRequest)
		return
	}

	if err := services.RespondJoinRequest(groupID, userCtx.ID, requesterID, status); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Join request response recorded")
}
