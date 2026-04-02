package services

import (
	"errors"
	"social-network/src/app/user/block/repo"
)

func BlockUser(currentUserID, targetUserID string) error {
	if currentUserID == targetUserID {
		return errors.New("cannot block yourself")
	}

	exists, err := repo.CheckUserExists(targetUserID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("user not found")
	}

	isBlocked, err := repo.CheckBlockExists(currentUserID, targetUserID)
	if err != nil {
		return err
	}
	if isBlocked {
		return errors.New("user is already blocked")
	}

	return repo.CreateBlockTx(currentUserID, targetUserID)
}
