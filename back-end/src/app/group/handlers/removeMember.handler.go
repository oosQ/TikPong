package handlers

import (
	"net/http"
	"social-network/src/app/group/services"
	"social-network/src/utils"
	"social-network/src/models"
)

func RemoveMemberHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	groupID := r.PathValue("groupId")
	userID := r.PathValue("userId")

	err := services.RemoveMember(groupID, userCtx.ID, userID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, nil, "Member removed successfully")
}
