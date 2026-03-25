package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func FollowUser(currentUserID, followingID string) error {
	if currentUserID == followingID {
		return errors.New("cannot follow yourself")
	}

	isPublic, err := repo.IsUserPublic(followingID)
	if err != nil {
		return err
	}
	if !isPublic {
		return errors.New("cannot follow a private user without sending a follow request")
	}
	exists, err := repo.CheckFollowExists(currentUserID, followingID)
	if err != nil {
		return err
	}

	if exists {
		return errors.New("already following this user")
	}

	return repo.CreateFollow(currentUserID, followingID)
}