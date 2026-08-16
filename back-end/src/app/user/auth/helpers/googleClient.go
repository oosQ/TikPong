package helpers

import (
	"os"
	"strings"
)

const defaultGoogleRedirectURI = "http://localhost:8433/api/auth/google/callback"

func GetGoogleClientSecret() string {
	return strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_SECRET"))
}

func GetGoogleClientID() string {
	return strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
}

func GetGoogleRedirectURI() string {
	if value := strings.TrimSpace(os.Getenv("GOOGLE_REDIRECT_URI")); value != "" {
		return value
	}
	return defaultGoogleRedirectURI
}
