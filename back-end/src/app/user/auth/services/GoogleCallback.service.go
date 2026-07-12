package services

import (
	"fmt"
	"social-network/src/app/user/auth/helpers"
	"social-network/src/app/user/auth/repo"
	"social-network/src/models"
	"social-network/src/utils"
	"strings"
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

	baseNickname := strings.TrimSpace(userInfo.Name)
	if baseNickname == "" {
		baseNickname = strings.TrimSpace(strings.Split(userInfo.Email, "@")[0])
	}
	if baseNickname == "" {
		baseNickname = "user"
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
		avatarPath, err := utils.SaveUploadedImageFromURL(userInfo.Picture)
		if err != nil {
			return "", "", time.Time{}, err
		}

		nickname := baseNickname
		for suffix := 0; ; suffix++ {
			exists, checkErr := repo.CheckNicknameExists(nickname)
			if checkErr != nil {
				return "", "", time.Time{}, checkErr
			}
			if !exists {
				break
			}

			suffixValue := fmt.Sprintf("_%d", suffix+1)
			maxBaseLength := 30 - len(suffixValue)
			if maxBaseLength < 1 {
				maxBaseLength = 1
			}

			trimmedBase := []rune(baseNickname)
			if len(trimmedBase) > maxBaseLength {
				trimmedBase = trimmedBase[:maxBaseLength]
			}
			nickname = string(trimmedBase) + suffixValue
		}

		now := time.Now().Unix()

		user := models.User{
			ID:       userID,
			Email:    userInfo.Email,
			Nickname: nickname,

			PasswordHash: passwordHash,
			FirstName:    userInfo.Name,
			LastName:     "",

			AvatarPath:    avatarPath,
			IsPublic:      true,
			Role:          models.RoleUser,
			AboutMe:       "",
			VerifiedEmail: true,
			DateOfBirth:   time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),

			Status:    models.StatusOnline,
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
