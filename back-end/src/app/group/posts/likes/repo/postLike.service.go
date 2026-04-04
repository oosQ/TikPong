package repo

import (
	"database/sql"
	database "social-network/src/db"
)

func CreateGroupPostLike(postID, userID string) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_post_likes (post_id, user_id, created_at)
		VALUES (?, ?, ?)
	`, postID, userID, sql.NullTime{})
	return err
}

func CheckGroupPostLikeExists(postID, userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_post_likes WHERE post_id = ? AND user_id = ?
	`, postID, userID).Scan(&count)
	return count > 0, err
}

func DeleteGroupPostLike(postID, userID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM group_post_likes WHERE post_id = ? AND user_id = ?
	`, postID, userID)
	return err
}
