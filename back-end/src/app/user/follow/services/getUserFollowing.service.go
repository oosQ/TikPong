package services

import (
	"errors"
	userrepo "social-network/src/app/user/core/repo"
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetUserFollowing(currentUserID, targetUserID, cursor string, limit int) (*dto.GetFollowInfoResponse, error) {
	user, err := userrepo.GetUserProfileByID(targetUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	return repo.GetFollowing(targetUserID, cursor, limit)
}
