package handlers

import (
	"net/http"
	"social-network/src/middleware"
	"social-network/src/app/user/auth/services"
	"social-network/src/utils"
	"strings"
	"time"
)

func GoogleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	if middleware.GetCurrentUser(r) != nil {
		http.Error(w, "Already authenticated", http.StatusForbidden)
		return
	}

	if oauthErr := strings.TrimSpace(r.URL.Query().Get("error")); oauthErr != "" {
		utils.SendError(w, "Google OAuth error: "+oauthErr, http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code parameter", http.StatusBadRequest)
		return
	}

	sessionID, userID, sessionExpiration, err := services.GoogleCallback(code)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadGateway)
		return
	}
	
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		MaxAge:  int(sessionExpiration.Sub(time.Now()).Seconds()),
	})
	utils.SendSuccess(w, map[string]interface{}{
		"user_id":    userID,
		"expires_at": sessionExpiration.Unix(),
	}, "Authenticated with Google successfully")
}
