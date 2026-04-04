package repo

import (
	"database/sql"
	"social-network/src/app/user/core/dto"
	database "social-network/src/db"
	"time"
)
func GetUserByID(userID string) (*dto.UserProfileResponse, error) {
	 var Nickname, FirstName, LastName, AboutMe sql.NullString
	 var IsPublic int
	err := database.DB.QueryRow(`
		SELECT id, nickname, first_name, last_name, about_me, avatar_path, is_public
		FROM users
		WHERE id = ?
	`, userID).Scan(&userID, &Nickname, &FirstName, &LastName, &AboutMe, &IsPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &dto.UserProfileResponse{
		ID:        userID,
		Nickname:  Nickname.String,
		FirstName: FirstName.String,
		LastName:  LastName.String,
		AboutMe:   AboutMe.String,
		IsPublic:  IsPublic == 1,
	}, nil
}
func GetUserProfileByID(userID, currentUserID string) (*dto.UserProfileResponse, error) {
	var u dto.UserProfileResponse
	var isPublic int
	err := database.DB.QueryRow(`
		SELECT u.id, u.nickname, u.first_name, u.last_name, COALESCE(u.about_me, ''), COALESCE(u.avatar_path, ''),
		       u.is_public, COALESCE(CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END, 0), COALESCE(us.total_posts, 0), COALESCE(us.total_followers, 0), COALESCE(us.total_following, 0), u.created_at
		FROM users u
		LEFT JOIN user_summary us ON us.user_id = u.id
		LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
		WHERE u.id = ?
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = ? AND ub.blocked_id = u.id)
			   OR (ub.blocker_id = u.id AND ub.blocked_id = ?)
		)
	`, currentUserID, userID, currentUserID, currentUserID).Scan(
		&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.AboutMe, &u.AvatarPath,
		&isPublic, &u.IsFollowing, &u.TotalPosts, &u.TotalFollowers, &u.TotalFollowing, &u.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	u.IsPublic = isPublic == 1
	return &u, nil
}

func UpdateUser(userID, nickname, firstName, lastName, aboutMe string, isPublic bool) error {
	_, err := database.DB.Exec(`
		UPDATE users SET nickname = ?, first_name = ?, last_name = ?, about_me = ?, is_public = ?, updated_at = ? WHERE id = ?
	`, nickname, firstName, lastName, aboutMe, isPublic, time.Now(), userID)
	return err
}

func UpdateUserAvatar(userID, avatarPath string) error {
	_, err := database.DB.Exec(`UPDATE users SET avatar_path = ?, updated_at = ? WHERE id = ?`, avatarPath, time.Now(), userID)
	return err
}

func SearchUsers(currentUserID, query, cursor string, limit int) (*dto.SearchUsersResponse, error) {
	searchPattern := "%" + query + "%"
	queryStr := `
		SELECT u.id, u.nickname, u.first_name, u.last_name, COALESCE(u.avatar_path, ''), u.is_public
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

	rows, err := database.DB.Query(queryStr, searchPattern, searchPattern, searchPattern, currentUserID, currentUserID, currentUserID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.UserSearchResult, 0)
	for rows.Next() {
		var u dto.UserSearchResult
		var isPublic int
		if err := rows.Scan(&u.ID, &u.Nickname, &u.FirstName, &u.LastName, &u.AvatarPath, &isPublic); err != nil {
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
		SELECT u.id, u.nickname, COALESCE(u.avatar_path, ''),
		       COALESCE(CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END, 0)
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
	`, currentUserID, currentUserID, currentUserID, currentUserID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.UserListItem, 0, limit+1)
	for rows.Next() {
		var user dto.UserListItem
		if err := rows.Scan(&user.ID, &user.Nickname, &user.AvatarPath, &user.IsFollowing); err != nil {
			return nil, err
		}
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
