package validator

import (
	"errors"
	"strings"
	"time"

	"social-network/src/app/auth/dto"
)

var (
	ErrEmailRequired       = errors.New("email is required")
	ErrEmailInvalid        = errors.New("invalid email format")
	ErrPasswordRequired    = errors.New("password is required")
	ErrPasswordTooShort    = errors.New("password must be at least 8 characters")
	ErrFirstNameRequired   = errors.New("first_name is required")
	ErrLastNameRequired    = errors.New("last_name is required")
	ErrDOBRequired         = errors.New("date_of_birth is required")
	ErrDOBInvalidFormat    = errors.New("date_of_birth must be YYYY-MM-DD")
	ErrNicknameTooLong     = errors.New("nickname is too long (max 30)")
	ErrAboutMeTooLong      = errors.New("about_me is too long (max 500)")
	ErrAvatarPathInvalid   = errors.New("avatar_path must be a valid path")
)



func ValidateRegister(req dto.RegisterRequest) error {
	// required: email
	if err := ValidateEmail(req.Email); err != nil {
		return err
	}

	if err := ValidatePassword(req.Password); err != nil {
		return err
	}
     
	// required: first_name
	req.FirstName = strings.TrimSpace(req.FirstName)
	if req.FirstName == "" {
		return ErrFirstNameRequired
	}

	// required: last_name
	req.LastName = strings.TrimSpace(req.LastName)
	if req.LastName == "" {
		return ErrLastNameRequired
	}

	// required: date_of_birth (YYYY-MM-DD)
	req.DateOfBirth = strings.TrimSpace(req.DateOfBirth)
	if req.DateOfBirth == "" {
		return ErrDOBRequired
	}
	if _, err := time.Parse("2006-01-02", req.DateOfBirth); err != nil {
		return ErrDOBInvalidFormat
	}

	// optional: nickname
	req.Nickname = strings.TrimSpace(req.Nickname)
	if  len([]rune(req.Nickname)) > 30 {
		return ErrNicknameTooLong
	}

	// optional: about_me
	req.AboutMe = strings.TrimSpace(req.AboutMe)
	if len([]rune(req.AboutMe)) > 500 {
		return ErrAboutMeTooLong
	}

	// optional: avatar_path (very light check)
	req.AvatarPath = strings.TrimSpace(req.AvatarPath)
	if req.AvatarPath != "" {
		// basic safety: no spaces, not too long
		if strings.Contains(req.AvatarPath, " ") || len(req.AvatarPath) > 255 {
			return ErrAvatarPathInvalid
		}
	}

	return nil
}