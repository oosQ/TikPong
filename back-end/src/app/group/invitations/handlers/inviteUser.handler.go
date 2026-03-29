package handlers

import (
	"net/http"
	"social-network/src/app/group/invitations/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func InviteUserHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	inviteeID := r.PathValue("userId")
	if groupID == "" || inviteeID == "" {
		utils.SendError(w, "Missing required path params", http.StatusBadRequest)
		return
	}

	if err := services.InviteUser(groupID, userCtx.ID, inviteeID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, nil, "Invitation sent successfully")
}
