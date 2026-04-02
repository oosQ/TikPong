package repo

import (
	"social-network/src/app/user/follow/dto"
	database "social-network/src/db"
	"time"
)

func CreateFollow(followerID, followingID string) (err error) {
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

	_, err = tx.Exec(`INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)`, followerID, followingID, time.Now())
	if err != nil {
		return err
	}

	_, err = tx.Exec(`INSERT INTO user_summary (user_id, total_posts, total_followers, total_following) VALUES (?, 0, 0, 0) ON CONFLICT(user_id) DO NOTHING`, followerID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE user_summary SET total_following = total_following + 1 WHERE user_id = ?`, followerID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`INSERT INTO user_summary (user_id, total_posts, total_followers, total_following) VALUES (?, 0, 0, 0) ON CONFLICT(user_id) DO NOTHING`, followingID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE user_summary SET total_followers = total_followers + 1 WHERE user_id = ?`, followingID)
	return err
}

func CheckFollowExists(followerID, followingID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?
	`, followerID, followingID).Scan(&count)
	return count > 0, err
}

func CheckBlockedEitherWay(userA, userB string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM user_blocks
		WHERE (blocker_id = ? AND blocked_id = ?)
		   OR (blocker_id = ? AND blocked_id = ?)
	`, userA, userB, userB, userA).Scan(&count)
	return count > 0, err
}

func CreateFollowRequest(fromUserID, toUserID string) error {
	_, err := database.DB.Exec(`
		INSERT INTO follow_requests (requester_id, target_id, status, created_at)
		VALUES (?, ?, ?, ?)
	`, fromUserID, toUserID, "pending", time.Now())
	return err
}

func DeleteFollowRequest(fromUserID, toUserID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM follow_requests WHERE requester_id = ? AND target_id = ?
	`, fromUserID, toUserID)
	return err
}

func CheckPendingAcceptedFollowRequestExists(fromUserID, toUserID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM follow_requests WHERE requester_id = ? AND target_id = ? AND (status = 'pending' OR status = 'accepted')
	`, fromUserID, toUserID).Scan(&count)
	return count > 0, err
}
func CheckPendingFollowRequestExists(fromUserID, toUserID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM follow_requests WHERE requester_id = ? AND target_id = ? AND status = 'pending'
	`, fromUserID, toUserID).Scan(&count)
	return count > 0, err
}

func GetFollowRequests(userID string) ([]dto.FollowRequestReceivedResponse, error) {
	rows, err := database.DB.Query(`
		SELECT fr.requester_id, u.nickname, u.avatar_path, fr.status, fr.created_at
		FROM follow_requests fr
		JOIN users u ON u.id = fr.requester_id
		WHERE fr.target_id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = fr.target_id AND ub.blocked_id = fr.requester_id)
			   OR (ub.blocker_id = fr.requester_id AND ub.blocked_id = fr.target_id)
		)
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := make([]dto.FollowRequestReceivedResponse, 0)
	for rows.Next() {
		var requesterID, nickname, avatarPath, status string
		var createdAt time.Time
		if err := rows.Scan(&requesterID, &nickname, &avatarPath, &status, &createdAt); err != nil {
			return nil, err
		}
		requests = append(requests, dto.FollowRequestReceivedResponse{
			FromUserID: requesterID,
			TargetID:   userID,
			Nickname:   nickname,
			AvatarPath: avatarPath,
			Status:     status,
			CreatedAt:  createdAt,
		})
	}
	return requests, rows.Err()
}

func IsUserPublic(userID string) (bool, error) {
	var isPublic int
	err := database.DB.QueryRow(`SELECT is_public FROM users WHERE id = ?`, userID).Scan(&isPublic)
	if err != nil {
		return false, err
	}
	return isPublic == 1, nil
}

func GetFollowers(userID string) ([]dto.FollowInfoResponse, error) {
	rows, err := database.DB.Query(`
		SELECT f.follower_id, u.nickname, u.avatar_path
		FROM follows f
		JOIN users u ON u.id = f.follower_id
		WHERE f.following_id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = f.following_id AND ub.blocked_id = f.follower_id)
			   OR (ub.blocker_id = f.follower_id AND ub.blocked_id = f.following_id)
		)
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	followers := make([]dto.FollowInfoResponse, 0)
	for rows.Next() {
		var followerID, nickname, avatarPath string
		if err := rows.Scan(&followerID, &nickname, &avatarPath); err != nil {
			return nil, err
		}
		followers = append(followers, dto.FollowInfoResponse{
			UserID:     followerID,
			Nickname:   nickname,
			AvatarPath: avatarPath,
		})
	}
	return followers, rows.Err()
}

func GetFollowing(userID string) ([]dto.FollowInfoResponse, error) {
	rows, err := database.DB.Query(`
		SELECT f.following_id, u.nickname, u.avatar_path
		FROM follows f
		JOIN users u ON u.id = f.following_id
		WHERE f.follower_id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = f.follower_id AND ub.blocked_id = f.following_id)
			   OR (ub.blocker_id = f.following_id AND ub.blocked_id = f.follower_id)
		)
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	following := make([]dto.FollowInfoResponse, 0)
	for rows.Next() {
		var followingID, nickname, avatarPath string
		if err := rows.Scan(&followingID, &nickname, &avatarPath); err != nil {
			return nil, err
		}
		following = append(following, dto.FollowInfoResponse{
			UserID:     followingID,
			Nickname:   nickname,
			AvatarPath: avatarPath,
		})
	}
	return following, rows.Err()
}

func GetSentFollowRequests(userID string) ([]dto.FollowRequestResponse, error) {
	rows, err := database.DB.Query(`
		SELECT fr.target_id, u.nickname, u.avatar_path, fr.status, fr.created_at
		FROM follow_requests fr
		JOIN users u ON u.id = fr.target_id
		WHERE fr.requester_id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = fr.requester_id AND ub.blocked_id = fr.target_id)
			   OR (ub.blocker_id = fr.target_id AND ub.blocked_id = fr.requester_id)
		)
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := make([]dto.FollowRequestResponse, 0)
	for rows.Next() {
		var targetID, nickname, avatarPath, status string
		var createdAt time.Time
		if err := rows.Scan(&targetID, &nickname, &avatarPath, &status, &createdAt); err != nil {
			return nil, err
		}
		requests = append(requests, dto.FollowRequestResponse{
			RequesterID: userID,
			TargetID:    targetID,
			Nickname:    nickname,
			AvatarPath:  avatarPath,
			Status:      status,
			CreatedAt:   createdAt,
		})
	}
	return requests, rows.Err()
}

func UpdateFollowRequestStatus(fromUserID, toUserID, status string) error {
	_, err := database.DB.Exec(`
		UPDATE follow_requests SET status = ? WHERE requester_id = ? AND target_id = ?
	`, status, fromUserID, toUserID)
	return err
}

func CheckRejectFollowRequestExists(fromUserID, toUserID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM follow_requests WHERE requester_id = ? AND target_id = ? AND status = 'rejected'
	`, fromUserID, toUserID).Scan(&count)
	return count > 0, err
}

func AcceptFollowRequestTx(fromUserID, toUserID string) (err error) {
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
		UPDATE follow_requests SET status = 'accepted' WHERE requester_id = ? AND target_id = ?
	`, fromUserID, toUserID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)
	`, fromUserID, toUserID, time.Now())
	if err != nil {
		return err
	}

	_, err = tx.Exec(`INSERT INTO user_summary (user_id, total_posts, total_followers, total_following) VALUES (?, 0, 0, 0) ON CONFLICT(user_id) DO NOTHING`, fromUserID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE user_summary SET total_following = total_following + 1 WHERE user_id = ?`, fromUserID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`INSERT INTO user_summary (user_id, total_posts, total_followers, total_following) VALUES (?, 0, 0, 0) ON CONFLICT(user_id) DO NOTHING`, toUserID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE user_summary SET total_followers = total_followers + 1 WHERE user_id = ?`, toUserID)
	return err
}

func RemoveFollowerTx(followerID, currentUserID string) (err error) {
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
		DELETE FROM follow_requests WHERE requester_id = ? AND target_id = ?
	`, followerID, currentUserID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		DELETE FROM follows WHERE follower_id = ? AND following_id = ?
	`, followerID, currentUserID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`UPDATE user_summary SET total_following = CASE WHEN total_following > 0 THEN total_following - 1 ELSE 0 END WHERE user_id = ?`, followerID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE user_summary SET total_followers = CASE WHEN total_followers > 0 THEN total_followers - 1 ELSE 0 END WHERE user_id = ?`, currentUserID)
	return err
}

func DeleteAndCreateFollowRequest(deleteFromID, deleteToID, createFromID, createToID string) (err error) {
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
		DELETE FROM follow_requests WHERE requester_id = ? AND target_id = ?
	`, deleteFromID, deleteToID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO follow_requests (requester_id, target_id, status, created_at)
		VALUES (?, ?, 'pending', ?)
	`, createFromID, createToID, time.Now())
	return err
}