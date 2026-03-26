package repo

import database "social-network/src/db"

func CheckCommentLikeExists(commentID, userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM likes_comment
		WHERE comment_id = ? AND user_id = ?
	`, commentID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CreateCommentLike(commentID, userID string) error {
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
		INSERT INTO likes_comment (comment_id, user_id)
		VALUES (?, ?)
	`, commentID, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO comments_summary (comment_id, total_likes)
		VALUES (?, 0)
		ON CONFLICT(comment_id) DO NOTHING
	`, commentID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		UPDATE comments_summary
		SET total_likes = total_likes + 1,
			updated_at = CURRENT_TIMESTAMP
		WHERE comment_id = ?
	`, commentID)
	if err != nil {
		return err
	}

	return nil
}

func DeleteCommentLike(commentID, userID string) error {
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
		DELETE FROM likes_comment
		WHERE comment_id = ? AND user_id = ?
	`, commentID, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO comments_summary (comment_id, total_likes)
		VALUES (?, 0)
		ON CONFLICT(comment_id) DO NOTHING
	`, commentID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		UPDATE comments_summary
		SET total_likes = CASE WHEN total_likes > 0 THEN total_likes - 1 ELSE 0 END,
			updated_at = CURRENT_TIMESTAMP
		WHERE comment_id = ?
	`, commentID)
	if err != nil {
		return err
	}

	return nil
}
