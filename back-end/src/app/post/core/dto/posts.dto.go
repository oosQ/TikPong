package dto

import "time"

type CreatePostRequest struct {
	Title          string   `json:"title" validate:"required,min=1,max=255"`
	Content        string   `json:"content" validate:"required,min=1"`
	Privacy        string   `json:"privacy" validate:"required,oneof=public almost_private private"`
	ImagePath      string   `json:"image_path,omitempty"`
	Hashtags       []string `json:"hashtags,omitempty"`
	AllowedViewers []string `json:"allowed_viewers,omitempty"`
}

type EditPostRequest struct {
	Title          string   `json:"title"`
	Content        string   `json:"content"`
	Privacy        string   `json:"privacy"`
	ImagePath      string   `json:"image_path,omitempty"`
	Hashtags       []string `json:"hashtags,omitempty"`
	AllowedViewers []string `json:"allowed_viewers,omitempty"`
}

type PostSummaryResponse struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Nickname      string    `json:"nickname"`
	AvatarPath    string    `json:"avatar_path"`
	IsFollowing   int       `json:"is_following"`
	IsLiked       int       `json:"is_liked"`
	IsReposted    int       `json:"is_reposted"`
	Title         string    `json:"title"`
	Content       string    `json:"content"`
	Privacy       string    `json:"privacy"`
	ImagePath     string    `json:"image_path"`
	Hashtags      []string  `json:"hashtags,omitempty"`
	TotalLikes    int       `json:"total_likes"`
	TotalViews    int       `json:"total_views"`
	TotalComments int       `json:"total_comments"`
	TotalReposts  int       `json:"total_reposts"`
	IsEdited      bool      `json:"is_edited"`
	CreatedAt     time.Time `json:"created_at"`
}

type GetPostsResponse struct {
	Posts      []PostSummaryResponse `json:"posts"`
	NextCursor string                `json:"next_cursor,omitempty"`
	Limit      int                   `json:"limit"`
}

type SearchPostsResponse struct {
	Posts      []PostSummaryResponse `json:"posts"`
	NextCursor string                `json:"next_cursor,omitempty"`
	Limit      int                   `json:"limit"`
}

type PostDetailResponse struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Nickname       string    `json:"nickname"`
	AvatarPath     string    `json:"avatar_path"`
	IsLiked        int       `json:"is_liked"`
	IsReposted     int       `json:"is_reposted"`
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	Privacy        string    `json:"privacy"`
	ImagePath      string    `json:"image_path"`
	TotalLikes     int       `json:"total_likes"`
	TotalViews     int       `json:"total_views"`
	TotalComments  int       `json:"total_comments"`
	TotalReposts   int       `json:"total_reposts"`
	IsEdited       bool      `json:"is_edited"`
	CreatedAt      time.Time `json:"created_at"`
	Hashtags       []string  `json:"hashtags"`
	AllowedViewers []string  `json:"allowed_viewers,omitempty"`
}
