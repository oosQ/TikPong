package handlers

import (
	"net/http"
	"social-network/src/models"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
)

func RevokeSessionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	err := services.RevokeUserSessions(userCtx.ID)
	if err != nil {
		http.Error(w, "Failed to revoke sessions", http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, nil, "All sessions revoked successfully")
}