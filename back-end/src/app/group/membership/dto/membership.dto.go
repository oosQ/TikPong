package dto

type GroupMemberResponse struct {
	UserID     string `json:"user_id"`
	Nickname   string `json:"nickname"`
	AvatarPath string `json:"avatar_path"`
	Role       string `json:"role"`
}
