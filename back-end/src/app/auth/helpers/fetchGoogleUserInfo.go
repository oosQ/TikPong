package helpers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"social-network/src/app/auth/dto"
)

func FetchGoogleUserInfo(accessToken string) (*dto.UserInfoResponse, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("google userinfo failed: status %d", resp.StatusCode)
	}

	var userInfo dto.UserInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	if userInfo.Email == "" {
		return nil, errors.New("google userinfo failed: missing email in response")
	}
	if userInfo.Name == "" {
		return nil, errors.New("google userinfo failed: missing name in response")
	}
	return &userInfo, nil
}
