package repo

const (
	CheckSessionQuery = `
		SELECT u.id, u.nickname , u.email, u.avatar_path , u.role
		FROM users u JOIN sessions s ON u.id = s.user_id
		WHERE s.id = ? AND s.expires_at > ?
	`
	CreateSessionQuery     = `INSERT INTO sessions (id, user_id, role, email, avatar_path, expires_at) VALUES (?, ?, ?, ?, ?, ?)`
	DeleteOldSessionsQuery = `DELETE FROM sessions WHERE user_id = ?`
	DeleteSessionQuery     = `DELETE FROM sessions WHERE id = ?`
	CheckCredentialsQuery  = `SELECT id, password_hash, email, role, avatar_path FROM users WHERE nickname = ? OR email = ? `
)
const (
	RegisterUserQuery = `INSERT INTO users (
id, 
email,
 password_hash,
   verified_email,
 first_name,
  last_name,
   avatar_path,
  nickname, 
  about_me,
   is_public,
    role,
   status,
   date_of_birth,
    created_at,
	 updated_at

) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?)`

	CheckEmailExistsQuery     = `SELECT COUNT(*) FROM users WHERE email = ?`
	CheckNicknameExistsQuery  = `SELECT COUNT(*) FROM users WHERE LOWER(TRIM(COALESCE(nickname, ''))) = LOWER(TRIM(?))`
	UpdatePasswordQuery       = `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	CheckCurrentPasswordQuery = `SELECT COUNT(*) FROM users WHERE id = ? AND password_hash = ?`
)
