package services

import (
	"errors"
	"social-network/src/app/user/auth/repo"
	"social-network/src/utils"
	"time"
)

var (
	ErrEmailNotFound = errors.New("Email not found")
)

func ForgotPassword(email string) error {
	userID, err := repo.GetUserIDByEmail(email)
	if err != nil {
		return ErrEmailNotFound
	}

	resetToken, err := utils.GenerateUUID()
	if err != nil {
		return errors.New("Failed to generate password reset token")
	}

	err = repo.StorePasswordResetToken(userID, resetToken, time.Now().Add(1*time.Hour))
	if err != nil {
		return errors.New("Failed to store password reset token")
	}
    
	err = utils.SendPasswordResetEmail(email, resetToken)
	if err != nil {
		return errors.New("Failed to send password reset email")
	}

	return nil
}