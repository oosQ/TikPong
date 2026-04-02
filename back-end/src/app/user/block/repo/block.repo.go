package repo

import (
	database "social-network/src/db"
	"social-network/src/app/user/block/dto"
	"time"
)

func CheckUserExists(userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE id = ?`, userID).Scan(&count)
	return count > 0, err
}

func CheckBlockExists(blockerID, blockedID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?
	`, blockerID, blockedID).Scan(&count)
	return count > 0, err
}

func CreateBlockTx(blockerID, blockedID string) (err error) {
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
		INSERT INTO user_blocks (blocker_id, blocked_id, created_at)
		VALUES (?, ?, ?)
	`, blockerID, blockedID, time.Now())
	if err != nil {
		return err
	}

	result, err := tx.Exec(`
		DELETE FROM follows WHERE follower_id = ? AND following_id = ?
	`, blockerID, blockedID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		_, err = tx.Exec(`UPDATE user_summary SET total_following = CASE WHEN total_following > 0 THEN total_following - 1 ELSE 0 END WHERE user_id = ?`, blockerID)
		if err != nil {
			return err
		}
		_, err = tx.Exec(`UPDATE user_summary SET total_followers = CASE WHEN total_followers > 0 THEN total_followers - 1 ELSE 0 END WHERE user_id = ?`, blockedID)
		if err != nil {
			return err
		}
	}

	result, err = tx.Exec(`
		DELETE FROM follows WHERE follower_id = ? AND following_id = ?
	`, blockedID, blockerID)
	if err != nil {
		return err
	}
	if rows, _ := result.RowsAffected(); rows > 0 {
		_, err = tx.Exec(`UPDATE user_summary SET total_following = CASE WHEN total_following > 0 THEN total_following - 1 ELSE 0 END WHERE user_id = ?`, blockedID)
		if err != nil {
			return err
		}
		_, err = tx.Exec(`UPDATE user_summary SET total_followers = CASE WHEN total_followers > 0 THEN total_followers - 1 ELSE 0 END WHERE user_id = ?`, blockerID)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(`
		DELETE FROM follow_requests
		WHERE (requester_id = ? AND target_id = ?) OR (requester_id = ? AND target_id = ?)
	`, blockerID, blockedID, blockedID, blockerID)
	if err != nil {
		return err
	}

	return nil
}

func DeleteBlock(blockerID, blockedID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?
	`, blockerID, blockedID)
	return err
}

func GetBlockedUsers(blockerID string) ([]dto.BlockedUserResponse, error) {
	rows, err := database.DB.Query(`
		SELECT ub.blocked_id, u.nickname, COALESCE(u.avatar_path, ''), ub.created_at
		FROM user_blocks ub
		JOIN users u ON u.id = ub.blocked_id
		WHERE ub.blocker_id = ?
		ORDER BY ub.created_at DESC
	`, blockerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	blockedUsers := make([]dto.BlockedUserResponse, 0)
	for rows.Next() {
		var item dto.BlockedUserResponse
		if err := rows.Scan(&item.UserID, &item.Nickname, &item.AvatarPath, &item.BlockedAt); err != nil {
			return nil, err
		}
		blockedUsers = append(blockedUsers, item)
	}

	return blockedUsers, rows.Err()
}
