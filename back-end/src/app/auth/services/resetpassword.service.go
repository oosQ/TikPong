package services

import (
	"errors"
	"social-network/src/app/auth/repo"
	"social-network/src/utils"
)


func ResetPassword(userID  string, newPassword string) error {
	 
	oldPasswordHash, err := repo.GetUserPasswordHash(userID)
	if err != nil {
		return errors.New("Failed to retrieve current password")
	}

	 if utils.CheckPasswordHash(newPassword, oldPasswordHash) {
		return errors.New("New password cannot be the same as the current password")
	}

    newPasswordHash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("Failed to hash password")
	}
    
	err = repo.UpdateUserPassword(userID, newPasswordHash)
	if err != nil {
		return errors.New("Failed to update password")
	}
	return nil
}