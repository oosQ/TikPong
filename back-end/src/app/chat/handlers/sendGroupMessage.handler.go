package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/services"
	"social-network/src/models"
	"social-network/src/utils"
	"strings"
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
	var imagePath string
	contentType := r.Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(20 << 20); err != nil {
			utils.SendError(w, "Invalid multipart form data", http.StatusBadRequest)
			return
		}

		req.Content = r.FormValue("content")
		uploadedPath, err := utils.SaveUploadedPrivateMessageImage(r)
		if err != nil {
			utils.SendError(w, err.Error(), http.StatusBadRequest)
			return
		}
		imagePath = uploadedPath
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.SendError(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		imagePath = req.ImagePath
	}

	messageID, err := services.SendGroupMessage(groupID, userCtx.ID, req.Content, imagePath)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, map[string]string{"message_id": messageID}, "Group message sent")
}
