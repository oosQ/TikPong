package repo

import (
	"social-network/src/app/group/posts/comments/dto"
	database "social-network/src/db"
	"time"
)

func CreateGroupComment(commentID, groupPostID, userID, content, imagePath string) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_comments (id, group_post_id, user_id, content, image_path, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, commentID, groupPostID, userID, content, imagePath, time.Now())
	return err
}

func ListGroupComments(groupPostID, cursor string, limit int) (*dto.ListGroupCommentsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT gc.id, gc.group_post_id, gc.user_id, gc.content, COALESCE(gc.image_path, ''), u.nickname, COALESCE(u.avatar_path, ''), gc.created_at
		FROM group_comments gc
		JOIN users u ON u.id = gc.user_id
		WHERE gc.group_post_id = ?
		AND (
			? = ''
			OR gc.created_at > (SELECT created_at FROM group_comments WHERE id = ?)
			OR (gc.created_at = (SELECT created_at FROM group_comments WHERE id = ?) AND gc.id > ?)
		)
		ORDER BY gc.created_at ASC, gc.id ASC
		LIMIT ?
	`, groupPostID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupCommentResponse, 0, limit+1)
	for rows.Next() {
		var item dto.GroupCommentResponse
		if err := rows.Scan(&item.ID, &item.GroupPostID, &item.UserID, &item.Content, &item.ImagePath, &item.Nickname, &item.AvatarPath, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.ListGroupCommentsResponse{
		Comments: items,
		Limit:    limit,
	}

	if len(items) > limit {
		result.Comments = items[:limit]
		result.NextCursor = result.Comments[len(result.Comments)-1].ID
	}

	return result, nil
}
