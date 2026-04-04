package repo

import (
	
	"social-network/src/db"
	"social-network/src/app/group/posts/core/dto"
	"time"
)

func CreateGroupPost(postID, groupID, userID, title, content, imagePath string) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_posts (id, group_id, user_id, title, content, image_path, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, postID, groupID, userID, title, content, imagePath, time.Now())
	return err
}

func ListGroupPosts(groupID, cursor string, limit int) (*dto.ListGroupPostsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT gp.id, gp.group_id, gp.user_id, gp.title, gp.content, COALESCE(gp.image_path, ''), u.nickname, COALESCE(u.avatar_path, ''), gp.created_at
		FROM group_posts gp
		JOIN users u ON u.id = gp.user_id
		WHERE gp.group_id = ?
		AND (
			? = ''
			OR gp.created_at < (SELECT created_at FROM group_posts WHERE id = ?)
			OR (gp.created_at = (SELECT created_at FROM group_posts WHERE id = ?) AND gp.id < ?)
		)
		ORDER BY gp.created_at DESC, gp.id DESC
		LIMIT ?
	`, groupID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupPostResponse, 0, limit+1)
	for rows.Next() {
		var item dto.GroupPostResponse
		if err := rows.Scan(&item.ID, &item.GroupID, &item.UserID, &item.Title, &item.Content, &item.ImagePath, &item.Nickname, &item.AvatarPath, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.ListGroupPostsResponse{
		Posts: items,
		Limit: limit,
	}

	if len(items) > limit {
		result.Posts = items[:limit]
		result.NextCursor = result.Posts[len(result.Posts)-1].ID
	}

	return result, nil
}
