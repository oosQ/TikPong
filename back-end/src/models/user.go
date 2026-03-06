package models

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
	ID           string     `db:"id"`
	Email        string     `db:"email"`
	PasswordHash string     `db:"password_hash"`

	FirstName   string `db:"first_name"`
	LastName    string `db:"last_name"`
	DateOfBirth string `db:"date_of_birth"`

	AvatarPath string `db:"avatar_path"`
	Nickname   string `db:"nickname"`
	AboutMe    string `db:"about_me"`

	IsPublic bool        `db:"is_public"`
	Role     UserRole   `db:"role"`
	Status   UserStatus `db:"status"`

	CreatedAt string `db:"created_at"`
	UpdatedAt string `db:"updated_at"`
}

type UserContext struct {
	ID       int
	Username string
}