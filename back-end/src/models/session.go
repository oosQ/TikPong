package models

import "time"

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Role 	UserRole  `json:"role"`
	Email   string    `json:"email"`
	AvatarPath string    `json:"avatar_path"`
	ExpiresAt time.Time `json:"expires_at"`
}