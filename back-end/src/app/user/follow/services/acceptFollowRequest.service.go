package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func AcceptFollowRequest(currentUserID, fromUserID string) error {
	requestExists, err := repo.CheckPendingFollowRequestExists(fromUserID, currentUserID)
	if err != nil {
		return err
	}
	if !requestExists {
		return errors.New("follow request not found")
	}

	return repo.AcceptFollowRequestTx(fromUserID, currentUserID)
}
