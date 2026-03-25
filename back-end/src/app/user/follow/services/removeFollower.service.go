package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func RemoveFollower(currentUserID, followerID string) error {
	if followerID == "" {
		return errors.New("user_id is required")
	}

	if currentUserID == followerID {
		return errors.New("cannot remove yourself")
	}

	exists, err := repo.CheckFollowExists(followerID, currentUserID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("follower not found")
	}

	return repo.RemoveFollowerTx(followerID, currentUserID)
}