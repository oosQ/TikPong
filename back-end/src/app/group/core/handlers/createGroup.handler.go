package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/group/core/dto"
	"social-network/src/app/group/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req dto.CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	groupID, err := services.CreateGroup(userCtx.ID, req)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, map[string]string{"group_id": groupID}, "Group created successfully")
}
