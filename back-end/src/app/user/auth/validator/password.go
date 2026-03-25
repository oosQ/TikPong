package validator

import (
	"errors"
	"regexp"
)

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("Password must be at least 8 characters long")
	}
	if !regexp.MustCompile(`[A-Z]`).MatchString(password) {
		return errors.New("Password must contain at least one uppercase letter")
	}
	if !regexp.MustCompile(`[a-z]`).MatchString(password) {
		return errors.New("Password must contain at least one lowercase letter")
	}
	if !regexp.MustCompile(`[0-9]`).MatchString(password) {
		return errors.New("Password must contain at least one digit")
	}
	return nil
}

func ValidateChangePassword(newPassword string, confirmPassword string) error {
	if newPassword != confirmPassword {
		return errors.New("Passwords do not match")
	}
	if err := ValidatePassword(newPassword); err != nil {
		return err
	}
	return nil
}

