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

func ListMembers(groupID string) ([]dto.GroupMemberResponse, error) {
	rows, err := database.DB.Query(`
		SELECT gm.user_id, u.nickname, u.avatar_path, gm.role
		FROM group_members gm
		JOIN users u ON u.id = gm.user_id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupMemberResponse, 0)
	for rows.Next() {
		var item dto.GroupMemberResponse
		if err := rows.Scan(&item.UserID, &item.Nickname, &item.AvatarPath, &item.Role); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
