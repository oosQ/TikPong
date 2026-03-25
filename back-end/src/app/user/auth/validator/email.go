package validator

import (
	"regexp"
)
var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func ValidateEmail(Email string) error {
	
	if Email == "" {
		return ErrEmailRequired
	}
	if !emailRegex.MatchString(Email) {
		return ErrEmailInvalid
	}

	return nil
}

