package handlers

import (
	"net/http"
	"social-network/src/app/group/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func DeleteGroupHandler(w http.ResponseWriter, r *http.Request) {
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

	if err := services.DeleteGroup(groupID, userCtx.ID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, nil, "Group deleted successfully")
}