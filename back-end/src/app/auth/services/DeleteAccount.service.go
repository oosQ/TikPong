package services

import (
	"errors"
	"social-network/src/app/auth/repo"
)

func DeleteAccount(userID string) error {
	err := repo.DeleteUserByID(userID)
	if err != nil {
		return errors.New("Failed to delete account")
	}

	err = repo.DeleteSessionsByUserID(userID)
	if err != nil {
		return errors.New("Failed to delete user sessions")
	}
	return nil
}