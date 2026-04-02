package repo

import (
	"social-network/src/app/post/hashtag/dto"
	database "social-network/src/db"
)

func GetAllHashtags() ([]dto.HashtagResponse, error) {
	rows, err := database.DB.Query(`
		SELECT id, name
		FROM hashtags
		ORDER BY name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	hashtags := make([]dto.HashtagResponse, 0)
	for rows.Next() {
		var item dto.HashtagResponse
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		hashtags = append(hashtags, item)
	}

	return hashtags, rows.Err()
}

func HashtagExists(hashtagID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM hashtags
		WHERE id = ?
	`, hashtagID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func GetPostsByHashtagID(hashtagID, currentUserID string) ([]dto.PostSummaryResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.title, p.content, p.user_id, p.privacy, p.image_path, p.created_at
		FROM posts p
		JOIN post_hashtags ph ON ph.post_id = p.id
		WHERE ph.hashtag_id = ?
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
		ORDER BY p.created_at DESC
	`, hashtagID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0)
	for rows.Next() {
		var item dto.PostSummaryResponse
		if err := rows.Scan(&item.ID, &item.Title, &item.Content, &item.UserID, &item.Privacy, &item.ImagePath, &item.CreatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, item)
	}

	return posts, rows.Err()
}