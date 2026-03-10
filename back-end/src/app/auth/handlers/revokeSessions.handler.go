package handlers

import (
	"net/http"
	"social-network/src/middleware"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
)

func RevokeSessionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	user := middleware.GetCurrentUser(r)
	if user == nil {
		utils.SendError(w, "Not authenticated", http.StatusUnauthorized)
		return
	}
	err := services.RevokeUserSessions(user.ID)
	if err != nil {
		http.Error(w, "Failed to revoke sessions", http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, nil, "All sessions revoked successfully")
}