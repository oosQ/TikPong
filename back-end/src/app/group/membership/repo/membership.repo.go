package repo

import (
	"social-network/src/db"
	"social-network/src/app/group/shared"
	"errors"
	"social-network/src/app/group/membership/dto"
)

func LeaveGroup(groupID, userID string) error {
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
	_, err = tx.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, groupID, userID)
	if err != nil {
		return err
	}
	var memberCount int
	err = tx.QueryRow(`SELECT COUNT(*) FROM group_members WHERE group_id = ?`, groupID).Scan(&memberCount)
	if err != nil {
		return err
	} 
	err = tx.Commit()
	if err != nil {
		return err
	}
	if memberCount == 0 {
		return shared.DeleteGroup(groupID)
	}
	return nil
}

func RemoveMember(groupID, targetUserID string) error {
	_, err := database.DB.Exec(`DELETE FROM group_members WHERE group_id = ? AND user_id = ?`, groupID, targetUserID)
	 if err != nil {
		err = errors.New("failed to remove member from group")
		return err
	}
   return nil
}

func ListMembers(groupID, cursor string, limit int) (*dto.ListMembersResponse, error) {
	rows, err := database.DB.Query(`
		SELECT gm.user_id, u.nickname, u.avatar_path, gm.role
		FROM group_members gm
		JOIN users u ON u.id = gm.user_id
		WHERE gm.group_id = ?
		AND (
			? = ''
			OR gm.created_at > (SELECT created_at FROM group_members WHERE group_id = ? AND user_id = ?)
			OR (gm.created_at = (SELECT created_at FROM group_members WHERE group_id = ? AND user_id = ?) AND gm.user_id > ?)
		)
		ORDER BY gm.created_at ASC, gm.user_id ASC
		LIMIT ?
	`, groupID, cursor, groupID, cursor, groupID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupMemberResponse, 0, limit+1)
	for rows.Next() {
		var item dto.GroupMemberResponse
		if err := rows.Scan(&item.UserID, &item.Nickname, &item.AvatarPath, &item.Role); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.ListMembersResponse{
		Members: items,
		Limit:   limit,
	}

	if len(items) > limit {
		result.Members = items[:limit]
		result.NextCursor = result.Members[len(result.Members)-1].UserID
	}

	return result, nil
}
