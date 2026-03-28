package handlers

import (
	"net/http"
	"social-network/src/app/user/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func ChangeAvatarHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := services.ChangeAvatar(userCtx.ID, r); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Avatar updated successfully")
}
