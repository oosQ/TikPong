package handlers

import (
	"net/http"
	"social-network/src/app/group/events/services"
	"social-network/src/models"
	"social-network/src/utils"
)
func GetEventResponseHandler(w http.ResponseWriter, r *http.Request) {
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

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	response, err := services.GetEventResponses(groupID, eventID, userCtx.ID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, response, "Event responses retrieved successfully")
}