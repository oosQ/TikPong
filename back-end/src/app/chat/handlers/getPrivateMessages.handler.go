package handlers

import (
	"net/http"
	"social-network/src/app/chat/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetPrivateMessagesHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	otherUserID := r.PathValue("userId")
	if otherUserID == "" {
		utils.SendError(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	items, err := services.GetPrivateMessages(userCtx.ID, otherUserID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, items, "Messages retrieved successfully")
}
