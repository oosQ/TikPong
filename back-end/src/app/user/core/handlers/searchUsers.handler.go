package handlers

import (
	"net/http"
	"social-network/src/app/user/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func SearchUsersHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		utils.SendError(w, "Missing required query parameter: q", http.StatusBadRequest)
		return
	}

	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	result, err := services.SearchUsers(userCtx.ID, query, cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, result, "Users found successfully")
}
