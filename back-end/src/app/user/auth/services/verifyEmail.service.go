package services

import (
	"errors"
	"fmt"
	"social-network/src/app/user/auth/repo"
)

func VerifyEmail(token string) error {
	userID, err := repo.GetUserIDByVerificationToken(token)
	if err != nil {
		return errors.New("Invalid or expired token")
	}
	fmt.Println("VerifyEmail called with token:", token, "userID:", userID)
	err = repo.MarkEmailAsVerified(userID)
	if err != nil {
		return errors.New("Failed to verify email")
	}
	err = repo.RemoveVerificationToken(userID)
	if err != nil {
		return errors.New("Failed to invalidate verification token")
	}
	return nil
}