package models

import "time"

type UserRole string

const (
	RoleUser      UserRole = "user"
	RoleModerator UserRole = "moderator"
	RoleAdmin     UserRole = "admin"
)

type UserStatus string

const (
	StatusOnline  UserStatus = "online"
	StatusOffline UserStatus = "offline"
)

type User struct {
	ID           string `db:"id"`
	Email        string `db:"email"`
	PasswordHash string `db:"password_hash"`

	FirstName   string `db:"first_name"`
	LastName    string `db:"last_name"`
	AvatarPath string `db:"avatar_path"`
	DateOfBirth  time.Time `db:"date_of_birth"`
	
	Nickname   string `db:"nickname"`
	AboutMe    string `db:"about_me"`

	IsPublic bool       `db:"is_public"`
	Role     UserRole   `db:"role"`
	Status   UserStatus `db:"status"`

    VerifiedEmail bool      `db:"verified_email"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type UserContext struct {
	ID 	 string `json:"id"`
	AvatarPath    string `json:"avatar_path"`
	Email    string `json:"email"`
	Nickname string `json:"nickname"`
 }