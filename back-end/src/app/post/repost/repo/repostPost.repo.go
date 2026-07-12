package repo

import database "social-network/src/db"

func CheckPostRepostExists(postID, userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM reposts_post
		WHERE post_id = ? AND user_id = ?
	`, postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CreatePostRepost(postID, userID string) error {
	_, err := database.DB.Exec(`
		INSERT INTO reposts_post (post_id, user_id)
		VALUES (?, ?)
	`, postID, userID)

	return err
}

func DeletePostRepost(postID, userID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM reposts_post
		WHERE post_id = ? AND user_id = ?
	`, postID, userID)

	return err
}
