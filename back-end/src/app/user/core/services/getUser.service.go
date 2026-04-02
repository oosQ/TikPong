package services

import (
	"errors"
	"social-network/src/app/user/core/dto"
	"social-network/src/app/user/core/repo"
)

func GetUser(currentUserID, userID string) (*dto.UserProfileResponse, error) {
	user, err := repo.GetUserByID(userID, currentUserID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}
