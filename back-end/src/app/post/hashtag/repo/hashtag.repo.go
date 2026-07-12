package repo

import (
	"social-network/src/app/post/hashtag/dto"
	database "social-network/src/db"
	"strings"
)

func GetAllHashtags(cursor string, limit int) (*dto.GetAllHashtagsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT h.id, h.name
		FROM hashtags h
		WHERE (
			? = ''
			OR h.name > (SELECT name FROM hashtags WHERE id = ?)
			OR (h.name = (SELECT name FROM hashtags WHERE id = ?) AND h.id > ?)
		)
		ORDER BY h.name ASC, h.id ASC
		LIMIT ?
	`, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	hashtags := make([]dto.HashtagResponse, 0, limit+1)
	for rows.Next() {
		var item dto.HashtagResponse
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		hashtags = append(hashtags, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetAllHashtagsResponse{
		Hashtags: hashtags,
		Limit:    limit,
	}

	if len(hashtags) > limit {
		result.Hashtags = hashtags[:limit]
		result.NextCursor = result.Hashtags[len(result.Hashtags)-1].ID
	}

	return result, nil
}

func HashtagExistsByName(hashtagName string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM hashtags
		WHERE LOWER(name) = LOWER(?)
	`, hashtagName).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func GetPostsByHashtagName(hashtagName, currentUserID, cursor string, limit int) (*dto.GetPostsByHashtagResponse, error) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.title, p.content, p.user_id, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.user_id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM likes_post lp WHERE lp.user_id = ? AND lp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM reposts_post rp WHERE rp.user_id = ? AND rp.post_id = p.id
		       ) THEN 1 ELSE 0 END,
		       p.privacy, COALESCE(p.image_path, ''),
		       COALESCE((
			       SELECT GROUP_CONCAT(h2.name, '|||')
			       FROM post_hashtags ph2
			       JOIN hashtags h2 ON h2.id = ph2.hashtag_id
			       WHERE ph2.post_id = p.id
			       ORDER BY h2.name ASC
		       ), ''),
		       COALESCE(ps.total_likes, 0), COALESCE(ps.total_views, 0), COALESCE(ps.total_comments, 0),
		       COALESCE((SELECT COUNT(*) FROM reposts_post rp WHERE rp.post_id = p.id), 0),
		       p.is_edited, p.created_at
		FROM posts p
		JOIN post_hashtags ph ON ph.post_id = p.id
		JOIN hashtags h ON h.id = ph.hashtag_id
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN posts_summary ps ON ps.post_id = p.id
		WHERE LOWER(h.name) = LOWER(?)
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
	`, currentUserID, currentUserID, currentUserID, hashtagName, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]dto.PostSummaryResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PostSummaryResponse
		var hashtags string
		var isEdited int
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Content,
			&item.UserID,
			&item.Nickname,
			&item.AvatarPath,
			&item.IsFollowing,
			&item.IsLiked,
			&item.IsReposted,
			&item.Privacy,
			&item.ImagePath,
			&hashtags,
			&item.TotalLikes,
			&item.TotalViews,
			&item.TotalComments,
			&item.TotalReposts,
			&isEdited,
			&item.CreatedAt,
		); err != nil {
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

	result := &dto.GetPostsByHashtagResponse{
		Posts: posts,
		Limit: limit,
	}

	if len(posts) > limit {
		result.Posts = posts[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}
