package dto

import "time"

type CreatePostRequest struct {
	Title   string `json:"title" validate:"required,min=1,max=255"`
	Content string `json:"content" validate:"required,min=1"`
	Privacy string `json:"privacy" validate:"required,oneof=public friends private"`
	ImagePath string `json:"image_path,omitempty"`
	Hashtags []string `json:"hashtags,omitempty"`
}

type EditPostRequest struct {
	Title     string   `json:"title"`
	Content   string   `json:"content"`
	Privacy   string   `json:"privacy"`
	ImagePath string   `json:"image_path,omitempty"`
	Hashtags  []string `json:"hashtags,omitempty"`
}

type PostSummaryResponse struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Privacy   string    `json:"privacy"`
	ImagePath string    `json:"image_path"`
	TotalLikes    int       `json:"total_likes"`
	TotalViews    int       `json:"total_views"`
	TotalComments int       `json:"total_comments"`
	IsEdited      bool      `json:"is_edited"`
	CreatedAt     time.Time `json:"created_at"`
}

type PostDetailResponse struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Privacy   string    `json:"privacy"`
	ImagePath string    `json:"image_path"`
	TotalLikes    int       `json:"total_likes"`
	TotalViews    int       `json:"total_views"`
	TotalComments int       `json:"total_comments"`
	IsEdited      bool      `json:"is_edited"`
	CreatedAt     time.Time `json:"created_at"`
	Hashtags      []string  `json:"hashtags"`
}