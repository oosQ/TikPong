package shared

import (
	"social-network/src/db"
)

func GroupPostBelongsToGroup(postID, groupID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_posts WHERE id = ? AND group_id = ?
	`, postID, groupID).Scan(&count)
	return count > 0, err
}