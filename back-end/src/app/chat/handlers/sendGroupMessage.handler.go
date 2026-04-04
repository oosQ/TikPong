package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func SendGroupMessageHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	if groupID == "" {
		utils.SendError(w, "Missing groupId parameter", http.StatusBadRequest)
		return
	}

	var req dto.SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	messageID, err := services.SendGroupMessage(groupID, userCtx.ID, req.Content)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, map[string]string{"message_id": messageID}, "Group message sent")
}
