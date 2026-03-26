package repo

import (
	"database/sql"
	"social-network/src/app/post/core/dto"
	database "social-network/src/db"
	"time"
)

func PostExists(postID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM posts WHERE id = ?`, postID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func GetPostOwnerID(postID string) (string, error) {
	var userID string
	err := database.DB.QueryRow(`SELECT user_id FROM posts WHERE id = ?`, postID).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}

	return userID, nil
}

func GetPosts(currentUserID string) ([]dto.PostSummaryResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, p.title, p.content, p.privacy, COALESCE(p.image_path, ''), COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0), p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE privacy = 'public' OR user_id = ?
		ORDER BY created_at DESC
	`, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		if err := rows.Scan(&item.ID, &item.UserID, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}

	return posts, rows.Err()
}

func GetPostByID(postID string) (*dto.PostDetailResponse, error) {
	var post dto.PostDetailResponse
	var isEdited int
	err := database.DB.QueryRow(`
		SELECT p.id, p.user_id, p.title, p.content, p.privacy, COALESCE(p.image_path, ''), COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0), p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE p.id = ?
	`, postID).Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.Privacy, &post.ImagePath, &post.TotalLikes, &post.TotalViews, &post.TotalComments, &isEdited, &post.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	post.IsEdited = isEdited == 1

	rows, err := database.DB.Query(`
		SELECT h.name
		FROM hashtags h
		JOIN post_hashtags ph ON ph.hashtag_id = h.id
		WHERE ph.post_id = ?
		ORDER BY h.name ASC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	post.Hashtags = make([]string, 0)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		post.Hashtags = append(post.Hashtags, name)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &post, nil
}

// DeletePost removes the post and returns the stored image path so the handler can clean up the file.
func DeletePost(postID string) (result string, err error) {
	var ownerID string
	var img sql.NullString
	err = database.DB.QueryRow(`SELECT user_id, image_path FROM posts WHERE id = ?`, postID).Scan(&ownerID, &img)
	if err != nil {
		return
	}

	var tx *sql.Tx
	tx, err = database.DB.Begin()
	if err != nil {
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
			return
		}
		err = tx.Commit()
	}()

	_, err = tx.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	if err != nil {
		return
	}

	_, err = tx.Exec(`UPDATE user_summary SET total_posts = CASE WHEN total_posts > 0 THEN total_posts - 1 ELSE 0 END WHERE user_id = ?`, ownerID)
	if err != nil {
		return
	}

	if img.Valid {
		result = img.String
	}
	return
}

// EditPostTx updates the post fields and replaces its hashtags within a single transaction.
func EditPostTx(postID, title, content, privacy, imagePath string, hashtags []string) (err error) {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
			return
		}
		err = tx.Commit()
	}()

	_, err = tx.Exec(`
		UPDATE posts
		SET title = ?, content = ?, privacy = ?, image_path = ?, is_edited = 1, edited_at = ?
		WHERE id = ?
	`, title, content, privacy, imagePath, time.Now(), postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM post_hashtags WHERE post_id = ?`, postID)
	if err != nil {
		return err
	}

	err = createPostHashtags(tx, postID, hashtags)
	return err
}
