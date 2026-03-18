package helpers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"social-network/src/app/auth/dto"
)
func ExchangeCodeForToken(code string) (*dto.TokenResponse, error) {
	clientID := GetGoogleClientID()
	clientSecret :=  GetGoogleClientSecret()
	redirectURI := GetGoogleRedirectURI()

	if clientID == "" || clientSecret == "" || redirectURI == "" {
		return nil, errors.New("google oauth config is missing; set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI")
	}

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("google token exchange failed: status %d", resp.StatusCode)
	}

	var tokenResp dto.TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	if tokenResp.AccessToken == "" {
		return nil, errors.New("google token exchange failed: missing access token in response")
	}

	return &tokenResp, nil
}
