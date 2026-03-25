package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func CancelFollowRequest(currentUserID, targetID string) error {
	requestExists, err := repo.CheckPendingFollowRequestExists(currentUserID, targetID)
	if err != nil {
		return err
	}
	if !requestExists {
		return errors.New("follow request not found")
	}
	return repo.DeleteFollowRequest(currentUserID, targetID)
}