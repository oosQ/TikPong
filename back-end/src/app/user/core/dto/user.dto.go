package dto

import "time"

type UserProfileResponse struct {
	ID             string    `json:"id"`
	Nickname       string    `json:"nickname"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	AboutMe        string    `json:"about_me"`
	AvatarPath     string    `json:"avatar_path"`
	IsPublic       bool      `json:"is_public"`
	IsFollowing    int       `json:"is_following"`
	TotalPosts     int       `json:"total_posts"`
	TotalFollowers int       `json:"total_followers"`
	TotalFollowing int       `json:"total_following"`
	CreatedAt      time.Time `json:"created_at"`
}

type EditUserRequest struct {
	Nickname  string `json:"nickname"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	AboutMe   string `json:"about_me"`
	IsPublic  *bool  `json:"is_public"`
}

type UserSearchResult struct {
	ID         string `json:"id"`
	Nickname   string `json:"nickname"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	AvatarPath string `json:"avatar_path"`
	IsPublic   bool   `json:"is_public"`
}

type UserListItem struct {
	ID          string `json:"id"`
	Nickname    string `json:"nickname"`
	AvatarPath  string `json:"avatar_path"`
	IsFollowing int    `json:"is_following"`
	IsPublic    bool   `json:"is_public"`
}

type SearchUsersResponse struct {
	Users      []UserSearchResult `json:"users"`
	NextCursor string             `json:"next_cursor,omitempty"`
	Limit      int                `json:"limit"`
}

type GetUsersResponse struct {
	Users      []UserListItem `json:"users"`
	NextCursor string         `json:"next_cursor,omitempty"`
	Limit      int            `json:"limit"`
}
