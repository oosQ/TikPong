package services

import (
	"errors"
	"social-network/src/app/user/core/dto"
	"social-network/src/app/user/core/repo"
	"strings"
)

func EditUser(userID string, req dto.EditUserRequest) error {
	user, err := repo.GetUserByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	nickname := user.Nickname
	firstName := user.FirstName
	lastName := user.LastName
	aboutMe := user.AboutMe
	isPublic := user.IsPublic

	if req.Nickname != "" {
		nickname = strings.TrimSpace(req.Nickname)
	}
	if req.FirstName != "" {
		firstName = req.FirstName
	}
	if req.LastName != "" {
		lastName = req.LastName
	}
	if req.AboutMe != "" {
		aboutMe = req.AboutMe
	}
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}

	if nickname != "" {
		exists, err := repo.CheckNicknameExistsForOtherUser(userID, nickname)
		if err != nil {
			return err
		}
		if exists {
			return errors.New("nickname already exists")
		}
	}

	return repo.UpdateUser(userID, nickname, firstName, lastName, aboutMe, isPublic)
}
