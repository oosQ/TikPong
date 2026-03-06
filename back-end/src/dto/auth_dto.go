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