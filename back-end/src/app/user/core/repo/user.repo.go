package repo

import (
	"database/sql"
	"social-network/src/app/user/core/dto"
	database "social-network/src/db"
	"time"
)

func GetUserByID(userID string) (*dto.UserProfileResponse, error) {
	var u dto.UserProfileResponse
	var isPublic int
	err := database.DB.QueryRow(`
		SELECT u.id, u.nickname, u.first_name, u.last_name, COALESCE(u.about_me, ''), COALESCE(u.avatar_path, ''),
		       u.is_public, COALESCE(us.total_posts, 0), COALESCE(us.total_followers, 0), COALESCE(us.total_following, 0), u.created_at
		FROM users u
		LEFT JOIN user_summary us ON us.user_id = u.id
		WHERE u.id = ?
	`, userID).Scan(
		&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.AboutMe, &u.AvatarPath,
		&isPublic, &u.TotalPosts, &u.TotalFollowers, &u.TotalFollowing, &u.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	u.IsPublic = isPublic == 1
	return &u, nil
}

func UpdateUser(userID, nickname, firstName, lastName, aboutMe string, isPublic bool) error {
	_, err := database.DB.Exec(`
		UPDATE users SET nickname = ?, first_name = ?, last_name = ?, about_me = ?, is_public = ?, updated_at = ? WHERE id = ?
	`, nickname, firstName, lastName, aboutMe, isPublic, time.Now(), userID)
	return err
}

func UpdateUserAvatar(userID, avatarPath string) error {
	_, err := database.DB.Exec(`UPDATE users SET avatar_path = ?, updated_at = ? WHERE id = ?`, avatarPath, time.Now(), userID)
	return err
}
