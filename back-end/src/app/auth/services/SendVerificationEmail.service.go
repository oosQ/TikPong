package services

import (
	"errors"
	"social-network/src/app/auth/repo"
	"social-network/src/utils"
	"time"
)
func SendVerificationEmail(email string) error {
	userID, err := repo.GetUserIDByEmail(email)
	if err != nil {
		return ErrEmailNotFound
	}
    IsVerified, err := repo.IsEmailVerified(userID)
	if err != nil {
		return errors.New("Failed to check email verification status")
	}
	if IsVerified {
		return errors.New("Email is already verified")
	}
	
	verificationToken, err := utils.GenerateUUID()
	if err != nil {
		return errors.New("Failed to generate email verification token")
	}

	err = repo.StoreEmailVerificationToken(userID, verificationToken, time.Now().Add(24*time.Hour))
	if err != nil {
		return errors.New("Failed to store email verification token")
	}

	err = utils.SendEmailVerificationEmail(email, verificationToken)
	if err != nil {
		return errors.New("Failed to send email verification email")
	}

	return nil
}