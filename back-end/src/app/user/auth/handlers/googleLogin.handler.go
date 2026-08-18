package handlers

import (
	"net/http"
	"net/url"
	"social-network/src/app/user/auth/services"
	"social-network/src/middleware"
)

func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
	if middleware.GetCurrentUser(r) != nil {
		http.Error(w, "Already authenticated", http.StatusForbidden)
		return
	}

	authURL, err := services.GetGoogleAuthURL()
	if err != nil {
		http.Redirect(w, r, getFrontendURL()+"/auth/login?oauth_error="+url.QueryEscape(err.Error()), http.StatusFound)
		return
	}
	http.Redirect(w, r, authURL, http.StatusFound)
}
