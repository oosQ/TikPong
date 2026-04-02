package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func AcceptFollowRequest(currentUserID, fromUserID string) error {
	blocked, err := repo.CheckBlockedEitherWay(currentUserID, fromUserID)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New("cannot accept follow request from a blocked user")
	}

	requestExists, err := repo.CheckPendingFollowRequestExists(fromUserID, currentUserID)
	if err != nil {
		return err
	}
	if !requestExists {
		return errors.New("follow request not found")
	}

	return repo.AcceptFollowRequestTx(fromUserID, currentUserID)
}
