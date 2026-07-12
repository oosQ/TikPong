package handlers

import (
	"net/http"
	"net/url"
	"os"
	"social-network/src/app/user/auth/services"
	"social-network/src/middleware"
	"strings"
	"time"
)

func getFrontendURL() string {
	if value := strings.TrimSpace(os.Getenv("FRONTEND_URL")); value != "" {
		return strings.TrimRight(value, "/")
	}

	return "http://localhost:3000"
}

func GoogleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	if middleware.GetCurrentUser(r) != nil {
		http.Redirect(w, r, getFrontendURL()+"/posts", http.StatusFound)
		return
	}

	if oauthErr := strings.TrimSpace(r.URL.Query().Get("error")); oauthErr != "" {
		http.Redirect(w, r, getFrontendURL()+"/auth/login?oauth_error="+url.QueryEscape("Google OAuth error: "+oauthErr), http.StatusFound)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Redirect(w, r, getFrontendURL()+"/auth/login?oauth_error="+url.QueryEscape("Missing code parameter"), http.StatusFound)
		return
	}

	sessionID, userID, sessionExpiration, err := services.GoogleCallback(code)
	if err != nil {
		http.Redirect(w, r, getFrontendURL()+"/auth/login?oauth_error="+url.QueryEscape(err.Error()), http.StatusFound)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int(sessionExpiration.Sub(time.Now()).Seconds()),
	})

	_ = userID
	_ = sessionExpiration
	http.Redirect(w, r, getFrontendURL()+"/posts", http.StatusFound)
}
