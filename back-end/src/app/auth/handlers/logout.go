package handlers

import (
	"net/http"
	"social-network/src/middleware"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if middleware.GetCurrentUser(r) == nil {
		utils.SendError(w, "Not authenticated", http.StatusUnauthorized)
		return
	}
	
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "Missing session ID", http.StatusUnauthorized)
		return
	}

	sessionID := cookie.Value

	err = services.LogoutUser(sessionID)
	if err != nil {
		http.Error(w, "Failed to logout", http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, nil, "Logged out successfully")
}
