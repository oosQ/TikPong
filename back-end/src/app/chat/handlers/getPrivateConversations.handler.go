package handlers

import (
	"net/http"
	"social-network/src/app/chat/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetPrivateConversationsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	items, err := services.GetPrivateConversations(userCtx.ID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, items, "Private conversations retrieved successfully")
}
