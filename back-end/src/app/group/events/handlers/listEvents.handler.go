package handlers

import (
	"net/http"
	"social-network/src/app/group/events/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func ListEventsHandler(w http.ResponseWriter, r *http.Request) {
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

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	events, err := services.ListEvents(groupID, userCtx.ID, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, events, "Group events retrieved successfully")
}
