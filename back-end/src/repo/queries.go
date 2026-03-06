package repo


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

