package dto

import "time"

type HashtagResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type GetAllHashtagsResponse struct {
	Hashtags   []HashtagResponse `json:"hashtags"`
	NextCursor string            `json:"next_cursor,omitempty"`
	Limit      int               `json:"limit"`
}

type PostSummaryResponse struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UserID    string    `json:"user_id"`
	Privacy   string    `json:"privacy"`
	ImagePath string    `json:"image_path"`
	CreatedAt time.Time `json:"created_at"`
}

type GetPostsByHashtagResponse struct {
	Posts      []PostSummaryResponse `json:"posts"`
	NextCursor string                `json:"next_cursor,omitempty"`
	Limit      int                   `json:"limit"`
}
