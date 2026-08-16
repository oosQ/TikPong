package repo

import (
	"database/sql"
	"social-network/src/app/user/core/dto"
	database "social-network/src/db"
	"strings"
	"time"
)

func GetUserDisplayName(userID string) string {
	var nickname, firstName, lastName sql.NullString
	err := database.DB.QueryRow(`SELECT nickname, first_name, last_name FROM users WHERE id = ?`, userID).Scan(&nickname, &firstName, &lastName)
	if err != nil {
		return ""
	}
	fullName := strings.TrimSpace(firstName.String + " " + lastName.String)
	if fullName != "" {
		return fullName
	}
	if nickname.String != "" {
		return nickname.String
	}
	return ""
}

func GetUserByID(userID string) (*dto.UserProfileResponse, error) {
	var Nickname, FirstName, LastName, AboutMe, Status sql.NullString
	var AvatarPath sql.NullString
	var IsPublic int
	err := database.DB.QueryRow(`
		SELECT id, COALESCE(nickname, ''), COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(about_me, ''), COALESCE(avatar_path, ''), COALESCE(status, 'offline'), is_public
		FROM users
		WHERE id = ?
	`, userID).Scan(&userID, &Nickname, &FirstName, &LastName, &AboutMe, &AvatarPath, &Status, &IsPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &dto.UserProfileResponse{
		ID:         userID,
		Nickname:   Nickname.String,
		FirstName:  FirstName.String,
		LastName:   LastName.String,
		AboutMe:    AboutMe.String,
		AvatarPath: AvatarPath.String,
		Status:     Status.String,
		IsPublic:   IsPublic == 1,
	}, nil
}
func GetUserProfileByID(userID, currentUserID string) (*dto.UserProfileResponse, error) {
	var u dto.UserProfileResponse
	var isPublic int
	var isBlocked int
	err := database.DB.QueryRow(`
		SELECT u.id, COALESCE(u.nickname, ''), COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.about_me, ''), COALESCE(u.avatar_path, ''),
		       COALESCE(u.status, 'offline'), u.is_public, COALESCE(CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END, 0),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follow_requests fr
			       WHERE fr.requester_id = ? AND fr.target_id = u.id AND fr.status = 'pending'
		       ) THEN 1 ELSE 0 END,
		       COALESCE(CASE WHEN blocked_by_me.blocker_id IS NOT NULL THEN 1 ELSE 0 END, 0),
		       COALESCE(us.total_posts, 0), COALESCE(us.total_followers, 0), COALESCE(us.total_following, 0), u.created_at
		FROM users u
		LEFT JOIN user_summary us ON us.user_id = u.id
		LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
		LEFT JOIN user_blocks blocked_by_me ON blocked_by_me.blocker_id = ? AND blocked_by_me.blocked_id = u.id
		WHERE u.id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE ub.blocker_id = u.id AND ub.blocked_id = ?
		)
	`, currentUserID, currentUserID, currentUserID, userID, currentUserID).Scan(
		&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.AboutMe, &u.AvatarPath, &u.Status,
		&isPublic, &u.IsFollowing, &u.IsFollowRequestPending, &isBlocked, &u.TotalPosts, &u.TotalFollowers, &u.TotalFollowing, &u.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	u.IsPublic = isPublic == 1
	u.IsBlocked = isBlocked == 1
	return &u, nil
}

func UpdateUser(userID, nickname, firstName, lastName, aboutMe string, isPublic bool) error {
	_, err := database.DB.Exec(`
		UPDATE users SET nickname = ?, first_name = ?, last_name = ?, about_me = ?, is_public = ?, updated_at = ? WHERE id = ?
	`, nickname, firstName, lastName, aboutMe, isPublic, time.Now(), userID)
	return err
}

func CheckNicknameExistsForOtherUser(userID, nickname string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM users
		WHERE id != ?
		AND LOWER(TRIM(COALESCE(nickname, ''))) = LOWER(TRIM(?))
	`, userID, strings.TrimSpace(nickname)).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func UpdateUserAvatar(userID, avatarPath string) error {
	_, err := database.DB.Exec(`UPDATE users SET avatar_path = ?, updated_at = ? WHERE id = ?`, avatarPath, time.Now(), userID)
	return err
}

func SearchUsers(currentUserID, query, cursor string, limit int) (*dto.SearchUsersResponse, error) {
	searchPattern := "%" + query + "%"
	queryStr := `
		SELECT u.id, COALESCE(u.nickname, ''), COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.avatar_path, ''), COALESCE(u.status, 'offline'), u.is_public,
		       CASE WHEN EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id) THEN 1 ELSE 0 END,
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follow_requests fr
			       WHERE fr.requester_id = ? AND fr.target_id = u.id AND fr.status = 'pending'
		       ) THEN 1 ELSE 0 END
		FROM users u
		WHERE (LOWER(u.nickname) LIKE LOWER(?) OR LOWER(u.first_name) LIKE LOWER(?) OR LOWER(u.last_name) LIKE LOWER(?))
		AND u.id != ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = ? AND ub.blocked_id = u.id)
			   OR (ub.blocker_id = u.id AND ub.blocked_id = ?)
		)
		AND (? = '' OR u.id < ?)
		ORDER BY u.id DESC
		LIMIT ?
	`

	rows, err := database.DB.Query(queryStr, currentUserID, currentUserID, searchPattern, searchPattern, searchPattern, currentUserID, currentUserID, currentUserID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.UserSearchResult, 0)
	for rows.Next() {
		var u dto.UserSearchResult
		var isPublic int
		if err := rows.Scan(&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.AvatarPath, &u.Status, &isPublic, &u.IsFollowing, &u.IsFollowRequestPending); err != nil {
			return nil, err
		}
		u.IsPublic = isPublic == 1
		items = append(items, u)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.SearchUsersResponse{Limit: limit, Users: items}
	if len(items) > limit {
		result.Users = items[:limit]
		result.NextCursor = result.Users[len(result.Users)-1].ID
	}
	return result, nil
}

func GetUsers(currentUserID, cursor string, limit int) (*dto.GetUsersResponse, error) {
	rows, err := database.DB.Query(`
		SELECT u.id, COALESCE(u.nickname, ''), COALESCE(u.first_name, ''), COALESCE(u.last_name, ''), COALESCE(u.avatar_path, ''), COALESCE(u.status, 'offline'), u.is_public,
		       COALESCE(CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END, 0),
		       CASE WHEN EXISTS (
			       SELECT 1 FROM follow_requests fr
			       WHERE fr.requester_id = ? AND fr.target_id = u.id AND fr.status = 'pending'
		       ) THEN 1 ELSE 0 END
		FROM users u
		LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
		WHERE u.id != ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = ? AND ub.blocked_id = u.id)
			   OR (ub.blocker_id = u.id AND ub.blocked_id = ?)
		)
		AND (? = '' OR u.id < ?)
		ORDER BY u.id DESC
		LIMIT ?
	`, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.UserListItem, 0, limit+1)
	for rows.Next() {
		var user dto.UserListItem
		var isPublic int
		if err := rows.Scan(&user.ID, &user.Nickname, &user.FirstName, &user.LastName, &user.AvatarPath, &user.Status, &isPublic, &user.IsFollowing, &user.IsFollowRequestPending); err != nil {
			return nil, err
		}
		user.IsPublic = isPublic == 1
		items = append(items, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetUsersResponse{Users: items, Limit: limit}
	if len(items) > limit {
		result.Users = items[:limit]
		result.NextCursor = result.Users[len(result.Users)-1].ID
	}

	return result, nil
}
