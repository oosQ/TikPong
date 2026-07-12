package handlers

import (
	"net/http"
	"social-network/src/app/notification/repo"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetUnreadCountHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	count, err := repo.GetUnreadCount(userCtx.ID)
	if err != nil {
		utils.SendError(w, "Failed to get unread count", http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, map[string]int{"count": count}, "Unread count retrieved")
}
