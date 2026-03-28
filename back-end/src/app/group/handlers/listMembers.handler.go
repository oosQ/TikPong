package handlers

import (
	"net/http"
	"social-network/src/app/group/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func ListMembersHandler(w http.ResponseWriter, r *http.Request) {
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

	members, err := services.ListMembers(groupID, userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, members, "Members retrieved successfully")
}
