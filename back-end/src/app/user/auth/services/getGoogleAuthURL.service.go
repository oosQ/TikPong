package services

import (
	"net/url"
	"social-network/src/app/user/auth/helpers"
)

func GetGoogleAuthURL() string {
	params := url.Values{}
	params.Set("client_id", helpers.GetGoogleClientID())
	params.Set("redirect_uri", helpers.GetGoogleRedirectURI())
	params.Set("response_type", "code")
	params.Set("scope", "openid email profile")
	params.Set("access_type", "offline")
	params.Set("prompt", "consent")

	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}