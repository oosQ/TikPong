package repo

import (
	"database/sql"
	"social-network/src/app/post/core/dto"
	database "social-network/src/db"
	"strings"
	"time"
)

func CanViewUserContent(userID, currentUserID string) (bool, error) {
	var allowed int
	err := database.DB.QueryRow(`
		SELECT CASE
			WHEN u.is_public = 1 OR u.id = ? OR EXISTS (
				SELECT 1 FROM follows f
				WHERE f.follower_id = ? AND f.following_id = u.id
			) THEN 1 ELSE 0 END
		FROM users u
		WHERE u.id = ?
	`, currentUserID, currentUserID, userID).Scan(&allowed)
	if err != nil {
		return false, err
	}
	return allowed == 1, nil
}

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

func GetPosts(currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''),
		       COALESCE((
			       SELECT GROUP_CONCAT(h.name, '|||')
			       FROM post_hashtags ph
			       JOIN hashtags h ON h.id = ph.hashtag_id
			       WHERE ph.post_id = p.id
			       ORDER BY h.name ASC
		       ), ''),
		       COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0),
		       p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE
			NOT EXISTS (
				SELECT 1 FROM user_blocks ub
				WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
				   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
			)
			AND (
			p.privacy = 'public'
			OR p.user_id = ?
			OR (p.privacy = 'almost_private' AND EXISTS (
				SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
			))
			OR (p.privacy = 'private' AND EXISTS (
				SELECT 1 FROM post_viewers WHERE post_id = p.id AND viewer_id = ?
			))
			)
			AND (
				? = ''
				OR p.created_at < (SELECT created_at FROM posts WHERE id = ?)
				OR (p.created_at = (SELECT created_at FROM posts WHERE id = ?) AND p.id < ?)
			)
		ORDER BY p.created_at DESC, p.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		var hashtags string
		if err := rows.Scan(&item.ID, &item.UserID, &item.Nickname, &item.AvatarPath, &item.IsFollowing, &item.IsLiked, &item.IsReposted, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &hashtags, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &item.TotalReposts, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		if hashtags != "" {
			item.Hashtags = strings.Split(hashtags, "|||")
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetPostsResponse{
		Posts: posts,
		Limit: limit,
	}

	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}

func GetExplorePosts(currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       0,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''),
		       COALESCE((
			       SELECT GROUP_CONCAT(h.name, '|||')
			       FROM post_hashtags ph
			       JOIN hashtags h ON h.id = ph.hashtag_id
			       WHERE ph.post_id = p.id
			       ORDER BY h.name ASC
		       ), ''),
		       COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0),
		       p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE p.privacy = 'public'
			AND p.user_id <> ?
			AND NOT EXISTS (
				SELECT 1 FROM follows f
				WHERE f.follower_id = ? AND f.following_id = p.user_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub
				WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
				   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
			)
			AND (
				? = ''
				OR p.created_at < (SELECT created_at FROM posts WHERE id = ?)
				OR (p.created_at = (SELECT created_at FROM posts WHERE id = ?) AND p.id < ?)
			)
		ORDER BY p.created_at DESC, p.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		var hashtags string
		if err := rows.Scan(&item.ID, &item.UserID, &item.Nickname, &item.AvatarPath, &item.IsFollowing, &item.IsLiked, &item.IsReposted, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &hashtags, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &item.TotalReposts, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		if hashtags != "" {
			item.Hashtags = strings.Split(hashtags, "|||")
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetPostsResponse{
		Posts: posts,
		Limit: limit,
	}

	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}

func GetPostsByUserID(userID, currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''),
		       COALESCE((
			       SELECT GROUP_CONCAT(h.name, '|||')
			       FROM post_hashtags ph
			       JOIN hashtags h ON h.id = ph.hashtag_id
			       WHERE ph.post_id = p.id
			       ORDER BY h.name ASC
		       ), ''),
		       COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0),
		       p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE p.user_id = ?
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub
				WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
				   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
			)
			AND (
				p.privacy = 'public'
				OR p.user_id = ?
				OR (p.privacy = 'almost_private' AND EXISTS (
					SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
				))
				OR (p.privacy = 'private' AND EXISTS (
					SELECT 1 FROM post_viewers WHERE post_id = p.id AND viewer_id = ?
				))
			)
			AND (
				? = ''
				OR p.created_at < (SELECT created_at FROM posts WHERE id = ?)
				OR (p.created_at = (SELECT created_at FROM posts WHERE id = ?) AND p.id < ?)
			)
		ORDER BY p.created_at DESC, p.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, userID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		var hashtags string
		if err := rows.Scan(&item.ID, &item.UserID, &item.Nickname, &item.AvatarPath, &item.IsFollowing, &item.IsLiked, &item.IsReposted, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &hashtags, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &item.TotalReposts, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		if hashtags != "" {
			item.Hashtags = strings.Split(hashtags, "|||")
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetPostsResponse{
		Posts: posts,
		Limit: limit,
	}

	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}

func GetCurrentUserLikedPosts(currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id
		       ) THEN 1 ELSE 0 END,
		       1,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''),
		       COALESCE((
			       SELECT GROUP_CONCAT(h.name, '|||')
			       FROM post_hashtags ph
			       JOIN hashtags h ON h.id = ph.hashtag_id
			       WHERE ph.post_id = p.id
			       ORDER BY h.name ASC
		       ), ''),
		       COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0),
		       p.is_edited, p.created_at
		FROM likes_post lp
		JOIN posts p ON p.id = lp.post_id
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE lp.user_id = ?
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub
				WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
				   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
			)
			AND (
				p.privacy = 'public'
				OR p.user_id = ?
				OR (p.privacy = 'almost_private' AND EXISTS (
					SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
				))
				OR (p.privacy = 'private' AND EXISTS (
					SELECT 1 FROM post_viewers WHERE post_id = p.id AND viewer_id = ?
				))
			)
			AND (
				? = ''
				OR lp.created_at < (SELECT created_at FROM likes_post WHERE post_id = ? AND user_id = ?)
				OR (lp.created_at = (SELECT created_at FROM likes_post WHERE post_id = ? AND user_id = ?) AND p.id < ?)
			)
		ORDER BY lp.created_at DESC, p.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, currentUserID, cursor, currentUserID, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		var hashtags string
		if err := rows.Scan(&item.ID, &item.UserID, &item.Nickname, &item.AvatarPath, &item.IsFollowing, &item.IsLiked, &item.IsReposted, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &hashtags, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &item.TotalReposts, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		if hashtags != "" {
			item.Hashtags = strings.Split(hashtags, "|||")
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetPostsResponse{
		Posts: posts,
		Limit: limit,
	}

	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}

func GetRepostedPostsByUserID(userID, currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp2 WHERE rp2.user_id = ? AND rp2.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''),
		       COALESCE((
			       SELECT GROUP_CONCAT(h.name, '|||')
			       FROM post_hashtags ph
			       JOIN hashtags h ON h.id = ph.hashtag_id
			       WHERE ph.post_id = p.id
			       ORDER BY h.name ASC
		       ), ''),
		       COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp3 WHERE rp3.post_id = p.id), 0),
		       p.is_edited, rp.created_at
		FROM reposts_post rp
		JOIN posts p ON p.id = rp.post_id
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE rp.user_id = ?
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub
				WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
				   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
			)
			AND (
				p.privacy = 'public'
				OR p.user_id = ?
				OR (p.privacy = 'almost_private' AND EXISTS (
					SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
				))
				OR (p.privacy = 'private' AND EXISTS (
					SELECT 1 FROM post_viewers WHERE post_id = p.id AND viewer_id = ?
				))
			)
			AND (
				? = ''
				OR rp.created_at < (SELECT created_at FROM reposts_post WHERE post_id = ? AND user_id = ?)
				OR (rp.created_at = (SELECT created_at FROM reposts_post WHERE post_id = ? AND user_id = ?) AND p.id < ?)
			)
		ORDER BY rp.created_at DESC, p.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, userID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, userID, cursor, userID, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		var hashtags string
		if err := rows.Scan(&item.ID, &item.UserID, &item.Nickname, &item.AvatarPath, &item.IsFollowing, &item.IsLiked, &item.IsReposted, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &hashtags, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &item.TotalReposts, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		if hashtags != "" {
			item.Hashtags = strings.Split(hashtags, "|||")
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetPostsResponse{
		Posts: posts,
		Limit: limit,
	}

	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}

func GetPostByID(postID, currentUserID string) (*dto.PostDetailResponse, error) {
	var post dto.PostDetailResponse
	var isEdited int
	err := database.DB.QueryRow(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''), COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0), p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE p.id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
			   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
		)
		AND (
			p.privacy = 'public'
			OR p.user_id = ?
			OR (p.privacy = 'almost_private' AND EXISTS (
				SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
			))
			OR (p.privacy = 'private' AND EXISTS (
				SELECT 1 FROM post_viewers WHERE post_id = p.id AND viewer_id = ?
			))
		)
	`, currentUserID, currentUserID, postID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID).Scan(&post.ID, &post.UserID, &post.Nickname, &post.AvatarPath, &post.IsLiked, &post.IsReposted, &post.Title, &post.Content, &post.Privacy, &post.ImagePath, &post.TotalLikes, &post.TotalViews, &post.TotalComments, &post.TotalReposts, &isEdited, &post.CreatedAt)
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

	// Fetch allowed viewers for private posts (visible to post owner)
	if post.Privacy == "private" {
		viewerRows, err := database.DB.Query(`SELECT viewer_id FROM post_viewers WHERE post_id = ?`, postID)
		if err != nil {
			return nil, err
		}
		defer viewerRows.Close()
		post.AllowedViewers = make([]string, 0)
		for viewerRows.Next() {
			var uid string
			if err := viewerRows.Scan(&uid); err != nil {
				return nil, err
			}
			post.AllowedViewers = append(post.AllowedViewers, uid)
		}
		if err := viewerRows.Err(); err != nil {
			return nil, err
		}
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

// EditPostTx updates the post fields, replaces its hashtags, and updates post_viewers within a single transaction.
func EditPostTx(postID, title, content, privacy, imagePath string, hashtags []string, allowedViewers []string) (err error) {
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
	if err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM post_viewers WHERE post_id = ?`, postID)
	if err != nil {
		return err
	}

	if privacy == "private" {
		for _, viewerID := range allowedViewers {
			_, err = tx.Exec(`INSERT OR IGNORE INTO post_viewers (post_id, viewer_id) VALUES (?, ?)`, postID, viewerID)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func SearchPosts(currentUserID, query, cursor string, limit int) (*dto.SearchPostsResponse, error) {
	searchPattern := "%" + query + "%"
	rows, err := database.DB.Query(`
		SELECT p.id, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.title, p.content, p.privacy, COALESCE(p.image_path, ''), COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0), p.is_edited, p.created_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE
			(LOWER(p.title) LIKE LOWER(?) OR LOWER(p.content) LIKE LOWER(?))
			AND NOT EXISTS (
				SELECT 1 FROM user_blocks ub
				WHERE (ub.blocker_id = ? AND ub.blocked_id = p.user_id)
				   OR (ub.blocker_id = p.user_id AND ub.blocked_id = ?)
			)
			AND (
				p.privacy = 'public'
				OR p.user_id = ?
				OR (p.privacy = 'almost_private' AND EXISTS (
					SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
				))
				OR (p.privacy = 'private' AND EXISTS (
					SELECT 1 FROM post_viewers WHERE post_id = p.id AND viewer_id = ?
				))
			)
			AND (
				? = ''
				OR p.created_at < (SELECT created_at FROM posts WHERE id = ?)
				OR (p.created_at = (SELECT created_at FROM posts WHERE id = ?) AND p.id < ?)
			)
		ORDER BY p.created_at DESC, p.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, searchPattern, searchPattern, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var isEdited int
		if err := rows.Scan(&item.ID, &item.UserID, &item.Nickname, &item.AvatarPath, &item.IsFollowing, &item.IsLiked, &item.IsReposted, &item.Title, &item.Content, &item.Privacy, &item.ImagePath, &item.TotalLikes, &item.TotalViews, &item.TotalComments, &item.TotalReposts, &isEdited, &item.CreatedAt); err != nil {
			return nil, err
		}
		item.IsEdited = isEdited == 1
		posts = append(posts, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.SearchPostsResponse{Limit: limit, Posts: posts}
	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}
	return result, nil
}
