package services

import (
	"social-network/src/app/auth/helpers"
	"social-network/src/app/auth/repo"
	"social-network/src/models"
	"social-network/src/utils"
	"time"
)

func GoogleCallback(code string) (string, string, time.Time, error) {
	// Exchange the authorization code for an access token
	tokenResp, err := helpers.ExchangeCodeForToken(code)
	if err != nil {
		return "", "", time.Time{}, err
	}
	// Fetch user info from Google using the access token
	userInfo, err := helpers.FetchGoogleUserInfo(tokenResp.AccessToken)
	if err != nil {
		return "", "", time.Time{}, err
	}

	var userID string
	userID, err = repo.GetUserIDByEmail(userInfo.Email)
	if err != nil {
		// User doesn't exist, create a new one
		password, err := utils.GenerateRandomPassword(12)
		if err != nil {
			return "", "", time.Time{}, err
		}

		passwordHash, err := utils.HashPassword(password)
		if err != nil {
			return "", "", time.Time{}, err
		}
		userID, err = utils.GenerateUUID()
		if err != nil {
			return "", "", time.Time{}, err
		}
		AvatarPath, err := utils.SaveUploadedImageFromURL(userInfo.Picture)
		if err != nil {
			return "", "", time.Time{}, err
		}
	now := time.Now().Unix()

		user := models.User{
			ID:           userID,
			Email:        userInfo.Email,
			Nickname:     userInfo.Name,

			PasswordHash: passwordHash,
			FirstName:    userInfo.Name,
			LastName:     "",

			AvatarPath:   AvatarPath,
			IsPublic:     true,
			Role:         models.RoleUser,
            AboutMe: "",
			VerifiedEmail: true,

			Status:        models.StatusOnline,
			CreatedAt: time.Unix(now, 0),
	     	UpdatedAt: time.Unix(now, 0),
		}
		err = repo.RegisterUser(user)
		if err != nil {
			return "", "", time.Time{}, err
		}
	}

	// Create session for the user
	sessionID, err := utils.GenerateSessionID()
	if err != nil {
		return "", "", time.Time{}, err
	}
	sessionExpiration := utils.GetSessionExpiry()
	session := models.Session{
		ID:        sessionID,
		UserID:    userID,
		ExpiresAt: sessionExpiration,
	}
	err = repo.CreateSession(session)
	if err != nil {
		return "", "", time.Time{}, err
	}

	return session.ID, userID, sessionExpiration, nil

}
