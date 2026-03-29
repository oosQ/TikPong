package handlers

import (
	"net/http"
	"social-network/src/app/notification/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func MarkNotificationReadHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	notificationID := r.PathValue("notificationId")
	if notificationID == "" {
		utils.SendError(w, "Missing notificationId parameter", http.StatusBadRequest)
		return
	}

	if err := services.MarkRead(userCtx.ID, notificationID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Notification marked as read")
}

func MarkAllNotificationsReadHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := services.MarkAllRead(userCtx.ID); err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, nil, "All notifications marked as read")
}
