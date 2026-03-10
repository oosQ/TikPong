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