package handlers

import (
	"net/http"
	"social-network/src/app/group/invitations/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func AcceptInvitationHandler(w http.ResponseWriter, r *http.Request) {
	respondInvitationHandler(w, r, "accepted")
}

func RejectInvitationHandler(w http.ResponseWriter, r *http.Request) {
	respondInvitationHandler(w, r, "rejected")
}

func respondInvitationHandler(w http.ResponseWriter, r *http.Request, status string) {
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

	if err := services.RespondInvitation(groupID, userCtx.ID, status); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Invitation response recorded")
}
