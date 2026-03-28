package handlers 

import (
	"net/http"
	"social-network/src/app/group/services"
	"social-network/src/utils"
	"social-network/src/models"
)

func GetGroupDetailsHandler(w http.ResponseWriter, r *http.Request) {
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

	groupDetails, err := services.GetGroupDetails(groupID, userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, groupDetails, "Group details retrieved successfully")
}