package handlers

import (
	"net/http"
	"social-network/src/app/group/events/services"
	"social-network/src/utils"
	"social-network/src/models"
)	

func CancelEventHandler(w http.ResponseWriter, r *http.Request) {
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

	if err := services.CancelEvent(groupID, eventID, userCtx.ID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "Event cancelled successfully")
}

