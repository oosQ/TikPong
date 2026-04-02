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

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	unreadOnly := r.URL.Query().Get("unread") == "true"
	result, err := services.GetNotifications(userCtx.ID, unreadOnly, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, result, "Notifications retrieved successfully")
}
