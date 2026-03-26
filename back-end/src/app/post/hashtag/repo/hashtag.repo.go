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

func GetPostsByHashtagID(hashtagID string) ([]dto.PostSummaryResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.title, p.content, p.user_id, p.privacy, p.image_path, p.created_at
		FROM posts p
		JOIN post_hashtags ph ON ph.post_id = p.id
		WHERE ph.hashtag_id = ?
		ORDER BY p.created_at DESC
	`, hashtagID)
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