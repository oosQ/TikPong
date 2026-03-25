package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func RejectFollowRequest(fromUserID, currentUserID string) error {
	requestExists, err := repo.CheckPendingFollowRequestExists(fromUserID, currentUserID)
	if err != nil {
		return err
	}
	if !requestExists {
		return errors.New("follow request not found")
	}

	return repo.UpdateFollowRequestStatus(fromUserID, currentUserID, "rejected")
}