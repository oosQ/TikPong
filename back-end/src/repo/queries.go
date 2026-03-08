package repo

const (
	CheckSessionQuery = `
		SELECT u.id, u.nickname
		FROM users u JOIN sessions s ON u.id = s.user_id
		WHERE s.id = ? AND s.expires_at > ?
	`
	CreateSessionQuery = `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`
	DeleteOldSessionsQuery = `DELETE FROM sessions WHERE user_id = ?`
	DeleteSessionQuery = `DELETE FROM sessions WHERE id = ?`
    CheckCredentialsQuery = `SELECT id, password_hash FROM users WHERE nickname = ? OR email = ?`
)
const (
	RegisterUserQuery = `INSERT INTO users (
id,
email,
password_hash,
first_name,
last_name,
date_of_birth,
avatar_path,
nickname,
about_me,
is_public,
role,
status,
created_at,
updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	CheckEmailExistsQuery = `SELECT COUNT(*) FROM users WHERE email = ?`
	CheckNicknameExistsQuery = `SELECT COUNT(*) FROM users WHERE nickname = ?`
)

