package services

import (
	"errors"
	"fmt"
	"social-network/src/app/user/auth/repo"
)

func ResetPasswordWithToken(token string, newPassword string) error {
	fmt.Println("ResetPasswordWithToken called with token:", token)
	userID, err := repo.GetUserIDByResetToken(token)
	if err != nil {
		return errors.New("Invalid or expired token")
	}
	err = ChangePassword(userID, newPassword)
	if err != nil {
		return err
	}
	err = repo.RemoveUsertoken(userID)
	if err != nil {
		return errors.New("Failed to invalidate reset token")
	}
	return nil
}
