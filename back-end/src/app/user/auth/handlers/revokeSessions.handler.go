package handlers

import (
	"net/http"
	"social-network/src/models"
	"social-network/src/app/user/auth/services"
	"social-network/src/utils"
)

func RevokeSessionsHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	err := services.RevokeUserSessions(userCtx.ID)
	if err != nil {
		utils.SendError(w, "Failed to revoke sessions", http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, nil, "All sessions revoked successfully")
}