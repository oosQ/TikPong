package services

import (
	"errors"
	"social-network/src/app/user/block/repo"
)

func UnblockUser(currentUserID, targetUserID string) error {
	if currentUserID == targetUserID {
		return errors.New("cannot unblock yourself")
	}

	isBlocked, err := repo.CheckBlockExists(currentUserID, targetUserID)
	if err != nil {
		return err
	}
	if !isBlocked {
		return errors.New("user is not blocked")
	}

	return repo.DeleteBlock(currentUserID, targetUserID)
}
