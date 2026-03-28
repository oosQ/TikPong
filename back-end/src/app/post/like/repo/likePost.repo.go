package repo

import database "social-network/src/db"

func PostExists(postID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM posts
		WHERE id = ?
	`, postID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CheckPostLikeExists(postID, userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM likes_post
		WHERE post_id = ? AND user_id = ?
	`, postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CreatePostLike(postID, userID string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
			return
		}
		_ = tx.Commit()
	}()

	_, err = tx.Exec(`
		INSERT INTO likes_post (post_id, user_id)
		VALUES (?, ?)
	`, postID, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO posts_summary (post_id, total_likes, total_views, total_comments)
		VALUES (?, 0, 0, 0)
		ON CONFLICT(post_id) DO NOTHING
	`, postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		UPDATE posts_summary
		SET total_likes = total_likes + 1,
			updated_at = CURRENT_TIMESTAMP
		WHERE post_id = ?
	`, postID)
	if err != nil {
		return err
	}

	return nil
}

func DeletePostLike(postID, userID string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
			return
		}
		_ = tx.Commit()
	}()

	_, err = tx.Exec(`
		DELETE FROM likes_post
		WHERE post_id = ? AND user_id = ?
	`, postID, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO posts_summary (post_id, total_likes, total_views, total_comments)
		VALUES (?, 0, 0, 0)
		ON CONFLICT(post_id) DO NOTHING
	`, postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		UPDATE posts_summary
		SET total_likes = CASE WHEN total_likes > 0 THEN total_likes - 1 ELSE 0 END,
			updated_at = CURRENT_TIMESTAMP
		WHERE post_id = ?
	`, postID)
	if err != nil {
		return err
	}

	return nil
}
