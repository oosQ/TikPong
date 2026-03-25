package dto

type RegisterRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=8"`

	FirstName   string `json:"first_name" validate:"required"`
	LastName    string `json:"last_name" validate:"required"`
	DateOfBirth string `json:"date_of_birth" validate:"required"`

	Nickname   string `json:"nickname,omitempty"`
	AboutMe    string `json:"about_me,omitempty"`
	AvatarPath string `json:"avatar_path,omitempty"`

	IsPublic bool `json:"is_public,omitempty"`
}

type RegisterResponse struct {
	UserID  string    `json:"user_id"`
}

type LoginRequest struct {
	NicknameOrEmail string `json:"nickname_or_email" validate:"required"`
	Password        string `json:"password" validate:"required"`
}
type LoginResponse struct {
	UserID    string `json:"user_id"`
	ExpiresAt int64  `json:"expires_at"`
}

type GetUserResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	AvatarPath string `json:"avatar_path"`
	Nickname string `json:"nickname"`
}

type ChangePasswordRequest struct {
	ConfirmPassword string `json:"confirm_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	ConfirmPassword string `json:"confirm_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type SendVerificationEmailRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
	RefreshToken string `json:"refresh_token,omitempty"`
}

type GoogleErrorResponse struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

type UserInfoResponse struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}