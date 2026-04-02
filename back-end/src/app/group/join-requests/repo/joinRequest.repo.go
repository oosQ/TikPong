package repo

import (
	"database/sql"
	"social-network/src/app/group/join-requests/dto"
	database "social-network/src/db"
	"time"
)

func GetJoinRequestStatus(groupID, requesterID string) (string, error) {
	var status string
	err := database.DB.QueryRow(`
		SELECT status FROM group_join_requests WHERE group_id = ? AND requester_id = ?
	`, groupID, requesterID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return status, nil
}

func CreateJoinRequest(groupID, userID string) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_join_requests (group_id, requester_id, status, created_at, updated_at)
		VALUES (?, ?, 'pending', ?, ?)
		ON CONFLICT(group_id, requester_id)
		DO UPDATE SET status = 'pending', updated_at = excluded.updated_at
	`, groupID, userID, time.Now(), time.Now())
	return err
}

func CancelJoinRequest(groupID, requesterID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM group_join_requests WHERE group_id = ? AND requester_id = ? AND status = 'pending'
	`, groupID, requesterID)
	return err
}

func RespondJoinRequest(groupID, requesterID, status string) (err error) {
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
		UPDATE group_join_requests SET status = ?, updated_at = ? WHERE group_id = ? AND requester_id = ?
	`, status, time.Now(), groupID, requesterID)
	if err != nil {
		return err
	}

	if status == "accepted" {
		_, err = tx.Exec(`
			INSERT OR IGNORE INTO group_members (group_id, user_id, role, created_at)
			VALUES (?, ?, 'member', ?)
		`, groupID, requesterID, time.Now())
		if err != nil {
			return err
		}
	}

	return nil
}

func ListJoinRequests(groupID string) ([]dto.JoinRequestResponse, error) {
	rows, err := database.DB.Query(`
		SELECT
			gjr.group_id || ':' || gjr.requester_id AS id,
			gjr.group_id,
			g.title,
			COALESCE(g.avatar_path, ''),
			gjr.requester_id,
			u.nickname,
			COALESCE(u.avatar_path, ''),
			gjr.created_at
		FROM group_join_requests gjr
		JOIN groups g ON g.id = gjr.group_id
		JOIN users u ON u.id = gjr.requester_id
		WHERE gjr.group_id = ? AND gjr.status = 'pending'
		ORDER BY gjr.created_at DESC
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.JoinRequestResponse, 0)
	for rows.Next() {
		var item dto.JoinRequestResponse
		if err := rows.Scan(
			&item.ID,
			&item.GroupID,
			&item.GroupTitle,
			&item.GroupAvatar,
			&item.RequesterID,
			&item.RequesterNickname,
			&item.AvatarPath,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func ListSentJoinRequests(userID string) ([]dto.SentJoinRequestResponse, error) {
	rows, err := database.DB.Query(`
		SELECT
			gjr.group_id || ':' || gjr.requester_id AS id,
			gjr.group_id,
			g.title,
			COALESCE(g.avatar_path, ''),
			g.creator_id,
			COALESCE(gc.nickname, ''),
			COALESCE(gc.avatar_path, ''),
			gjr.status,
			gjr.created_at,
			gjr.updated_at
		FROM group_join_requests gjr
		JOIN groups g ON g.id = gjr.group_id
		JOIN users gc ON gc.id = g.creator_id
		WHERE gjr.requester_id = ?
		ORDER BY gjr.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.SentJoinRequestResponse, 0)
	for rows.Next() {
		var item dto.SentJoinRequestResponse
		if err := rows.Scan(
			&item.ID,
			&item.GroupID,
			&item.GroupTitle,
			&item.GroupAvatar,
			&item.GroupCreatorID,
			&item.GroupCreatorName,
			&item.GroupCreatorAvatar,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}
