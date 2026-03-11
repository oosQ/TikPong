package handlers

import (
	"net/http"
	"social-network/src/app/auth/services"
	"social-network/src/middleware"
)

func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if middleware.GetCurrentUser(r) != nil {
		http.Error(w, "Already authenticated", http.StatusForbidden)
		return
	}

	authURL := services.GetGoogleAuthURL()
	http.Redirect(w, r, authURL, http.StatusFound)
}
