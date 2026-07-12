package handlers

import (
	"net/http"
	"social-network/src/app/chat/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func MarkPrivateMessagesReadHandler(w http.ResponseWriter, r *http.Request) {
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

	summary, err := services.MarkPrivateMessagesRead(userCtx.ID, otherUserID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, summary, "Messages marked as read")
}
