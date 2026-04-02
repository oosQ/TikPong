package handlers

import (
	"net/http"
	"social-network/src/app/user/block/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetBlockedUsersHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	blockedUsers, err := services.GetBlockedUsers(userCtx.ID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, blockedUsers, "Blocked users retrieved successfully")
}
