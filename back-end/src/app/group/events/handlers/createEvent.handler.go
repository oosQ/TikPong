package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/group/events/dto"
	"social-network/src/app/group/events/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
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

	var req dto.CreateEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	eventID, err := services.CreateEvent(groupID, userCtx.ID, req)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, map[string]string{"event_id": eventID}, "Event created successfully")
}

