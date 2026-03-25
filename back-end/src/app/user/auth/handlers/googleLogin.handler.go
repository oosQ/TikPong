package handlers

import (
	"net/http"
	"social-network/src/app/user/auth/services"
	"social-network/src/middleware"
)

func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
	if middleware.GetCurrentUser(r) != nil {
		http.Error(w, "Already authenticated", http.StatusForbidden)
		return
	}

	authURL := services.GetGoogleAuthURL()
	http.Redirect(w, r, authURL, http.StatusFound)
}
