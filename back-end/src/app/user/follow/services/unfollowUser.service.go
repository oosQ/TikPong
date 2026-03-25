package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func UnfollowUser(currentUserID, followingID string) error {
	exists, err := repo.CheckFollowExists(currentUserID, followingID)
	if err != nil {
		return err
	}

	if !exists {
		return errors.New("not following this user")
	}

	return repo.RemoveFollowerTx(currentUserID, followingID)
}