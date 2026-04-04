package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/src/app/group/events/dto"
	"social-network/src/app/group/events/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func EventResponseHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.PathValue("groupId")
	eventID := r.PathValue("eventId")
	if groupID == "" || eventID == "" {
		utils.SendError(w, "Missing required path params", http.StatusBadRequest)
		return
	}

	var req dto.EventAnswerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := services.SetEventResponse(groupID, eventID, userCtx.ID, req.Response); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Event response saved")
}
