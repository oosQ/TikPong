package services

import (
	"net/url"
	"social-network/src/utils"
)

func GetGoogleAuthURL() string {
	params := url.Values{}
	params.Set("client_id", utils.GetGoogleClientID())
	params.Set("redirect_uri", utils.GetGoogleRedirectURI())
	params.Set("response_type", "code")
	params.Set("scope", "openid email profile")
	params.Set("access_type", "offline")
	params.Set("prompt", "consent")

	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}