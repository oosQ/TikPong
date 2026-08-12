package validator

import (
	"errors"
	"social-network/src/app/user/auth/dto"
	"strings"
)

var (
	ErrNicknameOrEmailRequired = errors.New("nickname_or_email is required")
	ErrLoginPasswordRequired   = errors.New("password is required")
)

func ValidateLogin(req dto.LoginRequest) error {
	input := strings.TrimSpace(req.NicknameOrEmail)

	if input == "" {
		return ErrNicknameOrEmailRequired
	}

	if strings.TrimSpace(req.Password) == "" {
		return ErrLoginPasswordRequired
	}

	return nil
}
