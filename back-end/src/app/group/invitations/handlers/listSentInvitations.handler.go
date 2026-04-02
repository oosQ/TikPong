package handlers

import (
	"net/http"
	"social-network/src/app/group/invitations/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func ListSentInvitationsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	invitations, err := services.ListSentInvitations(userCtx.ID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, invitations, "Sent invitations retrieved successfully")
}