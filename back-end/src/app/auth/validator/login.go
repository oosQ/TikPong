package validator
import (
	"errors"
	"strings"
	"social-network/src/app/auth/dto"
    "regexp"
)
var (
    ErrNicknameOrEmailRequired  = errors.New("nickname_or_email is required")
    ErrNicknameOrEmailInvalid   = errors.New("must be a valid email or nickname (3-30 chars)")
)

var nicknameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{3,30}$`)

func ValidateLogin(req dto.LoginRequest) error {
    input := strings.TrimSpace(req.NicknameOrEmail)
    
    if input == "" {
        return ErrNicknameOrEmailRequired
    }
    
    isValidEmail := emailRegex.MatchString(strings.ToLower(input))
    isValidNickname := nicknameRegex.MatchString(input)
    
    if !isValidEmail && !isValidNickname {
        return ErrNicknameOrEmailInvalid
    }
    
    if strings.TrimSpace(req.Password) == "" {
        return ErrPasswordRequired
    }
    
    return nil
}