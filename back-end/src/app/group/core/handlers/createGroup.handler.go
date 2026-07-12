package handlers

import (
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
	avatarPath, err := utils.SaveUploadedGroupAvatar(r)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.GroupAvatar = avatarPath
	req.Description = r.FormValue("description")
	req.Title = r.FormValue("title")

	groupID, err := services.CreateGroup(userCtx.ID, req)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, map[string]string{"group_id": groupID}, "Group created successfully")
}
