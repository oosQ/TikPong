package helpers

import (
	"os"
	"strings"
)

var (
	// These default values should be replaced with your actual Google OAuth credentials
	defaultGoogleClientID     = ""
	defaultGoogleRedirectURI  = "http://localhost:8433/api/auth/google/callback"
	defaultGoogleClientSecret = ""
)

func GetGoogleClientSecret() string {
	if value := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_SECRET")); value != "" {
		return value
	}
	return defaultGoogleClientSecret
}
func GetGoogleClientID() string {
	if value := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID")); value != "" {
		return value
	}
	return defaultGoogleClientID
}

func GetGoogleRedirectURI() string {
	if value := strings.TrimSpace(os.Getenv("GOOGLE_REDIRECT_URI")); value != "" {
		return value
	}
	return defaultGoogleRedirectURI
}
