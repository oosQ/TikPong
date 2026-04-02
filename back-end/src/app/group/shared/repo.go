package shared

import (
	database "social-network/src/db"
	"database/sql"
)

func IsMember(groupID, userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_members WHERE group_id = ? AND user_id = ?
	`, groupID, userID).Scan(&count)
	return count > 0, err
}

func IsGroupOwner(groupID, userID string) (bool, error) {
	var creatorID string
	err := database.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, groupID).Scan(&creatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return creatorID == userID, nil
}

func GroupExists(groupID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM groups WHERE id = ?`, groupID).Scan(&count)
	return count > 0, err
}

func GetCreatorID(groupID string) (string, error) {
	var creatorID string
	err := database.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, groupID).Scan(&creatorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return creatorID, nil
}

func DeleteGroup(groupID string) error {
	_, err := database.DB.Exec(`DELETE FROM groups WHERE id = ?`, groupID)
	return err
}

func GetGroupMemberIDs(groupID string) ([]string, error) {
	rows, err := database.DB.Query(`SELECT user_id FROM group_members WHERE group_id = ?`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]string, 0)
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		ids = append(ids, userID)
	}
	return ids, rows.Err()
}