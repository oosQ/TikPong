package repo

import (
	"database/sql"
	"social-network/src/app/group/invitations/dto"
	database "social-network/src/db"
	"time"
)

func GetInvitationStatus(groupID, inviteeID string) (string, error) {
	var status string
	err := database.DB.QueryRow(`
		SELECT status FROM group_invitations WHERE group_id = ? AND invitee_id = ?
	`, groupID, inviteeID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}
	return status, nil
}

func RespondInvitation(groupID, inviteeID, status string) (err error) {
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
		UPDATE group_invitations SET status = ?, updated_at = ? WHERE group_id = ? AND invitee_id = ?
	`, status, time.Now(), groupID, inviteeID)
	if err != nil {
		return err
	}

	if status == "accepted" {
		_, err = tx.Exec(`
			INSERT OR IGNORE INTO group_members (group_id, user_id, role, created_at)
			VALUES (?, ?, 'member', ?)
		`, groupID, inviteeID, time.Now())
		if err != nil {
			return err
		}
	}

	return nil
}

func InviteUser(groupID, inviterID, inviteeID string) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_invitations (group_id, invitee_id, inviter_id, status, created_at, updated_at)
		VALUES (?, ?, ?, 'pending', ?, ?)
		ON CONFLICT(group_id, invitee_id)
		DO UPDATE SET inviter_id = excluded.inviter_id, status = 'pending', updated_at = excluded.updated_at
	`, groupID, inviteeID, inviterID, time.Now(), time.Now())
	return err
}

func CancelInvitation(groupID, inviterID, inviteeID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM group_invitations WHERE group_id = ? AND invitee_id = ? AND inviter_id = ? AND status = 'pending'
	`, groupID, inviteeID, inviterID)
	return err
}
func ListSentInvitations(userID string) ([]dto.SentInvitationResponse, error) {
	rows, err := database.DB.Query(`
		SELECT
			gi.group_id || ':' || gi.invitee_id AS id,
			gi.group_id,
			g.title,
			COALESCE(g.avatar_path, ''),
			gi.invitee_id,
			u.nickname,
			COALESCE(u.avatar_path, ''),
			gi.created_at
		FROM group_invitations gi
		JOIN groups g ON g.id = gi.group_id
		JOIN users u ON u.id = gi.invitee_id
		WHERE gi.inviter_id = ? and gi.status = 'pending'
		ORDER BY gi.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.SentInvitationResponse, 0)
	for rows.Next() {
		var item dto.SentInvitationResponse
		if err := rows.Scan(
			&item.ID,
			&item.GroupID,
			&item.GroupTitle,
			&item.GroupAvatar,
			&item.InviteeID,
			&item.InviteeNickname,
			&item.AvatarPath,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

func ListReceivedInvitations(userID string) ([]dto.ReceivedInvitationResponse, error) {
	rows, err := database.DB.Query(`
		SELECT
			gi.group_id || ':' || gi.invitee_id AS id,
			gi.group_id,
			g.title,
			COALESCE(g.avatar_path, ''),
			gi.inviter_id,
			u.nickname,
			COALESCE(u.avatar_path, ''),
			gi.created_at
		FROM group_invitations gi
		JOIN groups g ON g.id = gi.group_id
		JOIN users u ON u.id = gi.inviter_id
		WHERE gi.invitee_id = ? and gi.status = 'pending'
		ORDER BY gi.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.ReceivedInvitationResponse, 0)
	for rows.Next() {
		var item dto.ReceivedInvitationResponse
		if err := rows.Scan(
			&item.ID,
			&item.GroupID,
			&item.GroupTitle,
			&item.GroupAvatar,
			&item.InviterID,
			&item.InviterNickname,
			&item.AvatarPath,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}
