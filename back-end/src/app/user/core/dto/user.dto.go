package dto

import "time"

type UserProfileResponse struct {
	ID                     string    `json:"id"`
	Nickname               string    `json:"nickname"`
	FirstName              string    `json:"first_name"`
	LastName               string    `json:"last_name"`
	AboutMe                string    `json:"about_me"`
	AvatarPath             string    `json:"avatar_path"`
	Status                 string    `json:"status"`
	IsPublic               bool      `json:"is_public"`
	IsFollowing            int       `json:"is_following"`
	IsFollowRequestPending int       `json:"is_follow_request_pending"`
	IsBlocked              bool      `json:"is_blocked"`
	TotalPosts             int       `json:"total_posts"`
	TotalFollowers         int       `json:"total_followers"`
	TotalFollowing         int       `json:"total_following"`
	CreatedAt              time.Time `json:"created_at"`
}

type EditUserRequest struct {
	Nickname  string `json:"nickname"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	AboutMe   string `json:"about_me"`
	IsPublic  *bool  `json:"is_public"`
}

type UserSearchResult struct {
	ID                     string `json:"id"`
	Nickname               string `json:"nickname"`
	FirstName              string `json:"first_name"`
	LastName               string `json:"last_name"`
	AvatarPath             string `json:"avatar_path"`
	Status                 string `json:"status"`
	IsPublic               bool   `json:"is_public"`
	IsFollowing            int    `json:"is_following"`
	IsFollowRequestPending int    `json:"is_follow_request_pending"`
}

type UserListItem struct {
	ID                     string `json:"id"`
	Nickname               string `json:"nickname"`
	FirstName              string `json:"first_name"`
	LastName               string `json:"last_name"`
	AvatarPath             string `json:"avatar_path"`
	Status                 string `json:"status"`
	IsFollowing            int    `json:"is_following"`
	IsFollowRequestPending int    `json:"is_follow_request_pending"`
	IsPublic               bool   `json:"is_public"`
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
