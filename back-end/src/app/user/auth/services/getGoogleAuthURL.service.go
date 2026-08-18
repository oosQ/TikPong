package services

import (
	"errors"
	"net/url"
	"social-network/src/app/user/auth/helpers"
)

func GetGoogleAuthURL() (string, error) {
	clientID := helpers.GetGoogleClientID()
	if clientID == "" || helpers.GetGoogleClientSecret() == "" {
		return "", errors.New("Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the server")
	}

	params := url.Values{}
	params.Set("client_id", clientID)
	params.Set("redirect_uri", helpers.GetGoogleRedirectURI())
	params.Set("response_type", "code")
	params.Set("scope", "openid email profile")
	params.Set("access_type", "offline")
	params.Set("prompt", "consent")

	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode(), nil
}
