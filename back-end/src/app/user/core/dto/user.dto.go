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
