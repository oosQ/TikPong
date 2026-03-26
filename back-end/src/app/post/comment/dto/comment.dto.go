package dto

import "time"

type CreateCommentRequest struct {
	Content string `json:"content"`
}

type EditCommentRequest struct {
	Content string `json:"content"`
}

type CommentResponse struct {
	ID         string    `json:"id"`
	PostID     string    `json:"post_id"`
	UserID     string    `json:"user_id"`
	Content    string    `json:"content"`
	TotalLikes int       `json:"total_likes"`
	IsEdited   bool      `json:"is_edited"`
	CreatedAt  time.Time `json:"created_at"`
	Nickname   string    `json:"nickname"`
	AvatarPath string    `json:"avatar_path"`
}

type CommentActionResponse struct {
	CommentID string `json:"comment_id"`
	Action    string `json:"action"`
}
