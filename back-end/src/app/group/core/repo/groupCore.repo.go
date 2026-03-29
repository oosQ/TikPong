package repo

import (
	"time"
	database "social-network/src/db"
	"social-network/src/app/group/core/dto"
	"database/sql"
)

func CreateGroup(groupID, title, description, creatorID string) (err error) {
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
		INSERT INTO groups (id, title, description, creator_id, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, groupID, title, description, creatorID, time.Now())
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO group_members (group_id, user_id, role, created_at)
		VALUES (?, ?, 'creator', ?)
	`, groupID, creatorID, time.Now())
	return err
}

func GetGroups() ([]dto.GroupResponse, error) {
	rows, err := database.DB.Query(`
		SELECT id, title, description, creator_id, created_at
		FROM groups
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupResponse, 0)
	for rows.Next() {
		var item dto.GroupResponse
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.CreatorID, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func DeleteGroup(groupID string) error {
	_, err := database.DB.Exec(`DELETE FROM groups WHERE id = ?`, groupID)
	return err
}

func UpdateGroup(groupID, title, description string) error {
	_, err := database.DB.Exec(`
		UPDATE groups SET title = ?, description = ? WHERE id = ?
	`, title, description, groupID)
	return err
}

func GetGroupDetails(groupID string) (dto.GetGroupDetailsResponse, error) {
	var details dto.GetGroupDetailsResponse
	err := database.DB.QueryRow(`
		SELECT id, title, description, creator_id, created_at
		FROM groups
		WHERE id = ?
	`, groupID).Scan(&details.ID, &details.Title, &details.Description, &details.CreatorID, &details.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return dto.GetGroupDetailsResponse{}, nil
		}
		return dto.GetGroupDetailsResponse{}, err
	}

	err = database.DB.QueryRow(`
		SELECT nickname FROM users WHERE id = ?
	`, details.CreatorID).Scan(&details.CreatorNickname)
	if err != nil {
		if err == sql.ErrNoRows {
			details.CreatorNickname = ""
		} else {
			return dto.GetGroupDetailsResponse{}, err
		}
	}
   err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_members WHERE group_id = ?
	`, groupID).Scan(&details.MemberCount)
	if err != nil {
		return dto.GetGroupDetailsResponse{}, err
	}
	return details, nil
}

