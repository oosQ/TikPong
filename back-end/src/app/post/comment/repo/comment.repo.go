package repo

import (
	"database/sql"
	"social-network/src/app/post/comment/dto"
	database "social-network/src/db"
)

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

func CommentExists(commentID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM comments
		WHERE id = ?
	`, commentID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CreateComment(commentID, postID, userID, content string) error {
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
		INSERT INTO comments (id, post_id, user_id, content)
		VALUES (?, ?, ?, ?)
	`, commentID, postID, userID, content)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO comments_summary (comment_id, total_likes)
		VALUES (?, 0)
	`, commentID)
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
		SET total_comments = total_comments + 1,
			updated_at = CURRENT_TIMESTAMP
		WHERE post_id = ?
	`, postID)
	if err != nil {
		return err
	}

	return nil
}

func DeleteComment(commentID string) error {
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

	var postID string
	err = tx.QueryRow(`
		SELECT post_id
		FROM comments
		WHERE id = ?
	`, commentID).Scan(&postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		return err
	}

	_, err = tx.Exec(`
		DELETE FROM comments
		WHERE id = ?
	`, commentID)
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
		SET total_comments = CASE WHEN total_comments > 0 THEN total_comments - 1 ELSE 0 END,
			updated_at = CURRENT_TIMESTAMP
		WHERE post_id = ?
	`, postID)
	if err != nil {
		return err
	}

	return nil
}

func EditComment(commentID, content string) error {
	_, err := database.DB.Exec(`
		UPDATE comments
		SET content = ?, is_edited = 1
		WHERE id = ?
	`, content, commentID)
	return err
}

func GetCommentOwnerID(commentID string) (string, error) {
	var userID string
	err := database.DB.QueryRow(`
		SELECT user_id
		FROM comments
		WHERE id = ?
	`, commentID).Scan(&userID)

	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}

	return userID, nil
}

func GetCommentsByPostID(postID string) ([]dto.CommentResponse, error) {
	rows, err := database.DB.Query(`
		SELECT c.id, c.post_id, c.user_id, c.content, COALESCE(cs.total_likes, 0), c.created_at, c.is_edited, u.nickname, u.avatar_path
		FROM comments c
		JOIN users u ON u.id = c.user_id
		LEFT JOIN comments_summary cs ON cs.comment_id = c.id
		WHERE c.post_id = ?
		ORDER BY c.created_at DESC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]dto.CommentResponse, 0)
	for rows.Next() {
		var item dto.CommentResponse
		var isEdited int
		if err := rows.Scan(&item.ID, &item.PostID, &item.UserID, &item.Content, &item.TotalLikes, &item.CreatedAt, &isEdited, &item.Nickname, &item.AvatarPath); err != nil {
			return nil, err
		}
		item.IsEdited = isEdited == 1
		comments = append(comments, item)
	}

	return comments, rows.Err()
}

func GetCommentsByUserID(userID string) ([]dto.CommentResponse, error) {
	rows, err := database.DB.Query(`
		SELECT c.id, c.post_id, c.user_id, c.content, COALESCE(cs.total_likes, 0), c.created_at, c.is_edited, u.nickname, u.avatar_path
		FROM comments c
		JOIN users u ON u.id = c.user_id
		LEFT JOIN comments_summary cs ON cs.comment_id = c.id
		WHERE c.user_id = ?
		ORDER BY c.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]dto.CommentResponse, 0)
	for rows.Next() {
		var item dto.CommentResponse
		var isEdited int
		if err := rows.Scan(&item.ID, &item.PostID, &item.UserID, &item.Content, &item.TotalLikes, &item.CreatedAt, &isEdited, &item.Nickname, &item.AvatarPath); err != nil {
			return nil, err
		}
		item.IsEdited = isEdited == 1
		comments = append(comments, item)
	}

	return comments, rows.Err()
}
