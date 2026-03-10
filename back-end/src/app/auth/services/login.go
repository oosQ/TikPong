package services

import (
	"errors"
	"social-network/src/app/auth/dto"
	"social-network/src/models"
	"social-network/src/app/auth/repo"
	"social-network/src/utils"
	"time"
)

func LoginUser(req dto.LoginRequest) (string, string, time.Time, error) {
	 

	user, err := repo.CheckUserCredentials(req.NicknameOrEmail)
	if err != nil {
		return "", "", time.Time{}, err
	}


	isPasswordValid := utils.CheckPasswordHash(req.Password, user.PasswordHash)
	if !isPasswordValid {
		return "", "", time.Time{}, errors.New("invalid credentials")
	}

	err = repo.DeleteOldSessions(user.ID)
	if err != nil {
		return "", "", time.Time{}, err
	}

	sessionID, err := utils.GenerateSessionID()
	if err != nil {
		return "", "", time.Time{}, err
	}

    sessionExpiration := utils.GetSessionExpiry()
    session := models.Session{
		ID: sessionID,
		UserID: user.ID,
		ExpiresAt: sessionExpiration,
	}
	err = repo.CreateSession(session)
	if err != nil {
		return "", "", time.Time{}, err
	}

	return session.ID, session.UserID, session.ExpiresAt, nil
}