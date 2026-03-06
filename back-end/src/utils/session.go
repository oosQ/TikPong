package utils

import (
	"net/http"
	"time"
	"github.com/gofrs/uuid/v5"
)


func GenerateSessionID() (string, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return "", err
	}
	return id.String(), nil
}

func GetSessionExpiry() time.Time {
	return time.Now().Add(24 * time.Hour) 
}


func SetSessionCookie(w http.ResponseWriter, sessionID string, expiryTime time.Time) {
	cookie := &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		Expires:  expiryTime,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}


func RemoveSessionCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:   "session_id",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	}
	http.SetCookie(w, cookie)
}
