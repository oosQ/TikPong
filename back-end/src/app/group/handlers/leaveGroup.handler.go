package handlers

import (
	"net/http"
	"social-network/src/app/group/services"
	"social-network/src/utils"
	"social-network/src/models"
)

func LeaveGroupHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	if groupID == "" {
		utils.SendError(w, "Missing required path param: groupId", http.StatusBadRequest)
		return
	}

	if err := services.LeaveGroup(groupID, userCtx.ID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, nil, "Left group successfully")
}