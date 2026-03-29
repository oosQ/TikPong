package handlers

import (
	"net/http"
	"social-network/src/app/notification/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	unreadOnly := r.URL.Query().Get("unread") == "true"
	items, err := services.GetNotifications(userCtx.ID, unreadOnly)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, items, "Notifications retrieved successfully")
}
