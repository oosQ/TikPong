package repo

import (
	"database/sql"
	"social-network/src/app/chat/dto"
	database "social-network/src/db"
	"time"
)

func IsFollowing(followerID, followingID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?
	`, followerID, followingID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func IsUserPublic(userID string) (bool, error) {
	var isPublic int
	err := database.DB.QueryRow(`SELECT is_public FROM users WHERE id = ?`, userID).Scan(&isPublic)
	if err != nil {
		return false, err
	}
	return isPublic == 1, nil
}

func CheckBlockedEitherWay(userA, userB string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM user_blocks
		WHERE (blocker_id = ? AND blocked_id = ?)
		   OR (blocker_id = ? AND blocked_id = ?)
	`, userA, userB, userB, userA).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func SavePrivateMessage(id, senderID, recipientID, content, imagePath string) error {
	_, err := database.DB.Exec(`
		INSERT INTO private_messages (id, sender_id, recipient_id, content, image_path, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, id, senderID, recipientID, content, imagePath, time.Now())
	return err
}

func MarkPrivateMessagesRead(currentUserID, otherUserID string) error {
	_, err := database.DB.Exec(`
		UPDATE private_messages
		SET read_at = ?
		WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL
	`, time.Now(), otherUserID, currentUserID)
	return err
}

func GetPrivateMessages(userA, userB, cursor string, limit int) (*dto.GetPrivateMessagesResponse, error) {
	rows, err := database.DB.Query(`
		SELECT id, sender_id, recipient_id, content, COALESCE(image_path, ''), created_at
		FROM private_messages
		WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
		AND (
			? = ''
			OR created_at < (
				SELECT created_at FROM private_messages
				WHERE id = ? AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
			)
			OR (
				created_at = (
					SELECT created_at FROM private_messages
					WHERE id = ? AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
				)
				AND id < ?
			)
		)
		ORDER BY created_at DESC, id DESC
		LIMIT ?
	`, userA, userB, userB, userA, cursor, cursor, userA, userB, userB, userA, cursor, userA, userB, userB, userA, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.PrivateMessageResponse, 0, limit+1)
	for rows.Next() {
		var item dto.PrivateMessageResponse
		if err := rows.Scan(&item.ID, &item.SenderID, &item.RecipientID, &item.Content, &item.ImagePath, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetPrivateMessagesResponse{
		Messages: items,
		Limit:    limit,
	}

	if len(items) > limit {
		result.Messages = items[:limit]
		result.NextCursor = result.Messages[len(result.Messages)-1].ID
	}

	for left, right := 0, len(result.Messages)-1; left < right; left, right = left+1, right-1 {
		result.Messages[left], result.Messages[right] = result.Messages[right], result.Messages[left]
	}

	return result, nil
}

func SaveGroupMessage(id, groupID, senderID, content, imagePath string) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_messages (id, group_id, sender_id, content, image_path, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, id, groupID, senderID, content, imagePath, time.Now())
	return err
}

func GetGroupMessages(groupID, cursor string, limit int) (*dto.GetGroupMessagesResponse, error) {
	rows, err := database.DB.Query(`
		SELECT gm.id, gm.group_id, gm.sender_id, u.nickname, COALESCE(u.avatar_path, ''), gm.content, COALESCE(gm.image_path, ''), gm.created_at
		FROM group_messages gm
		JOIN users u ON u.id = gm.sender_id
		WHERE gm.group_id = ?
		AND (
			? = ''
			OR gm.created_at < (SELECT created_at FROM group_messages WHERE id = ? AND group_id = ?)
			OR (gm.created_at = (SELECT created_at FROM group_messages WHERE id = ? AND group_id = ?) AND gm.id < ?)
		)
		ORDER BY gm.created_at DESC, gm.id DESC
		LIMIT ?
	`, groupID, cursor, cursor, groupID, cursor, groupID, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupMessageResponse, 0, limit+1)
	for rows.Next() {
		var item dto.GroupMessageResponse
		if err := rows.Scan(&item.ID, &item.GroupID, &item.SenderID, &item.Nickname, &item.AvatarPath, &item.Content, &item.ImagePath, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetGroupMessagesResponse{
		Messages: items,
		Limit:    limit,
	}

	if len(items) > limit {
		result.Messages = items[:limit]
		result.NextCursor = result.Messages[len(result.Messages)-1].ID
	}

	for left, right := 0, len(result.Messages)-1; left < right; left, right = left+1, right-1 {
		result.Messages[left], result.Messages[right] = result.Messages[right], result.Messages[left]
	}

	return result, nil
}

func GetPrivateConversations(currentUserID, cursor string, limit int) (*dto.GetPrivateConversationsResponse, error) {
	rows, err := database.DB.Query(`
		WITH user_messages AS (
			SELECT
				pm.rowid AS row_num,
				pm.id,
				pm.sender_id,
				pm.recipient_id,
				pm.content,
				COALESCE(pm.image_path, '') AS image_path,
				pm.created_at,
				CASE WHEN pm.sender_id < pm.recipient_id THEN pm.sender_id ELSE pm.recipient_id END AS user_a,
				CASE WHEN pm.sender_id < pm.recipient_id THEN pm.recipient_id ELSE pm.sender_id END AS user_b
			FROM private_messages pm
			WHERE pm.sender_id = ? OR pm.recipient_id = ?
		), latest_pair AS (
			SELECT user_a, user_b, MAX(row_num) AS max_row_num
			FROM user_messages
			GROUP BY user_a, user_b
		)
		SELECT
			u.id,
			COALESCE(u.nickname, ''),
			u.first_name,
			u.last_name,
			COALESCE(u.avatar_path, ''),
			COALESCE(u.status, 'offline'),
			CASE
				WHEN COALESCE(um.content, '') <> '' THEN um.content
				WHEN COALESCE(um.image_path, '') <> '' THEN '[Image]'
				ELSE ''
			END,
			um.created_at,
			um.sender_id,
			(
				SELECT COUNT(*)
				FROM private_messages unread
				WHERE unread.sender_id = u.id
				  AND unread.recipient_id = ?
				  AND unread.read_at IS NULL
			) AS unread_count
		FROM user_messages um
		JOIN latest_pair lp
			ON lp.user_a = um.user_a
			AND lp.user_b = um.user_b
			AND lp.max_row_num = um.row_num
		JOIN users u
			ON u.id = CASE WHEN um.sender_id = ? THEN um.recipient_id ELSE um.sender_id END
		WHERE NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = ? AND ub.blocked_id = u.id)
			   OR (ub.blocker_id = u.id AND ub.blocked_id = ?)
		)
		ORDER BY um.created_at DESC, um.row_num DESC
	`, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.PrivateConversationResponse, 0)
	for rows.Next() {
		var item dto.PrivateConversationResponse
		if err := rows.Scan(
			&item.UserID,
			&item.Nickname,
			&item.FirstName,
			&item.LastName,
			&item.AvatarPath,
			&item.Status,
			&item.LastMessage,
			&item.LastMessageAt,
			&item.LastSenderID,
			&item.UnreadCount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	start := 0
	if cursor != "" {
		start = len(items)
		for i, item := range items {
			if item.UserID == cursor {
				start = i + 1
				break
			}
		}
	}

	paged := make([]dto.PrivateConversationResponse, 0, limit)
	if start < len(items) {
		end := start + limit
		if end > len(items) {
			end = len(items)
		}
		paged = items[start:end]
	}

	result := &dto.GetPrivateConversationsResponse{
		Conversations: paged,
		Limit:         limit,
	}

	if start+len(paged) < len(items) && len(paged) > 0 {
		result.NextCursor = paged[len(paged)-1].UserID
	}

	return result, nil
}

func GetPrivateConversationSummary(currentUserID, otherUserID string) (*dto.PrivateConversationResponse, error) {
	row := database.DB.QueryRow(`
		SELECT
			u.id,
			COALESCE(u.nickname, ''),
			u.first_name,
			u.last_name,
			COALESCE(u.avatar_path, ''),
			COALESCE(u.status, 'offline'),
			CASE
				WHEN COALESCE(pm.content, '') <> '' THEN pm.content
				WHEN COALESCE(pm.image_path, '') <> '' THEN '[Image]'
				ELSE ''
			END,
			pm.created_at,
			pm.sender_id,
			(
				SELECT COUNT(*)
				FROM private_messages unread
				WHERE unread.sender_id = u.id
				  AND unread.recipient_id = ?
				  AND unread.read_at IS NULL
			) AS unread_count
		FROM private_messages pm
		JOIN users u
			ON u.id = CASE WHEN pm.sender_id = ? THEN pm.recipient_id ELSE pm.sender_id END
		WHERE
			(pm.sender_id = ? AND pm.recipient_id = ?)
			OR (pm.sender_id = ? AND pm.recipient_id = ?)
		AND NOT EXISTS (
			SELECT 1 FROM user_blocks ub
			WHERE (ub.blocker_id = ? AND ub.blocked_id = ?)
			   OR (ub.blocker_id = ? AND ub.blocked_id = ?)
		)
		ORDER BY pm.created_at DESC, pm.rowid DESC
		LIMIT 1
	`, currentUserID, currentUserID, currentUserID, otherUserID, otherUserID, currentUserID, currentUserID, otherUserID, otherUserID, currentUserID)

	var item dto.PrivateConversationResponse
	if err := row.Scan(
		&item.UserID,
		&item.Nickname,
		&item.FirstName,
		&item.LastName,
		&item.AvatarPath,
		&item.Status,
		&item.LastMessage,
		&item.LastMessageAt,
		&item.LastSenderID,
		&item.UnreadCount,
	); err != nil {
		return nil, err
	}

	return &item, nil
}

func GetGroupConversations(currentUserID, cursor string, limit int) (*dto.GetGroupConversationsResponse, error) {
	rows, err := database.DB.Query(`
		WITH member_groups AS (
			SELECT gm.group_id
			FROM group_members gm
			WHERE gm.user_id = ?
		), latest_group_message AS (
			SELECT m.group_id, MAX(m.rowid) AS max_row_num
			FROM group_messages m
			JOIN member_groups mg ON mg.group_id = m.group_id
			GROUP BY m.group_id
		)
		SELECT
			g.id,
			g.title,
			COALESCE(g.avatar_path, ''),
			m.content,
			m.created_at,
			COALESCE(m.sender_id, ''),
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, '')
		FROM member_groups mg
		JOIN groups g ON g.id = mg.group_id
		LEFT JOIN latest_group_message lgm ON lgm.group_id = g.id
		LEFT JOIN group_messages m
			ON m.group_id = lgm.group_id
			AND m.rowid = lgm.max_row_num
		LEFT JOIN users u ON u.id = m.sender_id
		ORDER BY m.created_at DESC, g.created_at DESC
	`, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.GroupConversationResponse, 0)
	for rows.Next() {
		var item dto.GroupConversationResponse
		var lastMessage sql.NullString
		var lastMessageAt sql.NullTime
		if err := rows.Scan(
			&item.GroupID,
			&item.GroupTitle,
			&item.GroupAvatar,
			&lastMessage,
			&lastMessageAt,
			&item.LastSenderID,
			&item.LastSender,
			&item.LastSenderAvatarPath,
		); err != nil {
			return nil, err
		}

		if lastMessage.Valid {
			item.LastMessage = &lastMessage.String
		} else {
			item.LastMessage = nil
		}

		if lastMessageAt.Valid {
			t := lastMessageAt.Time
			item.LastMessageAt = &t
		} else {
			item.LastMessageAt = nil
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	start := 0
	if cursor != "" {
		start = len(items)
		for i, item := range items {
			if item.GroupID == cursor {
				start = i + 1
				break
			}
		}
	}

	paged := make([]dto.GroupConversationResponse, 0, limit)
	if start < len(items) {
		end := start + limit
		if end > len(items) {
			end = len(items)
		}
		paged = items[start:end]
	}

	result := &dto.GetGroupConversationsResponse{
		Conversations: paged,
		Limit:         limit,
	}

	if start+len(paged) < len(items) && len(paged) > 0 {
		result.NextCursor = paged[len(paged)-1].GroupID
	}

	return result, nil
}

func GetGroupConversationSummary(groupID string) (*dto.GroupConversationResponse, error) {
	row := database.DB.QueryRow(`
		SELECT
			g.id,
			g.title,
			COALESCE(g.avatar_path, ''),
			gm.content,
			gm.created_at,
			gm.sender_id,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, '')
		FROM group_messages gm
		JOIN groups g ON g.id = gm.group_id
		JOIN users u ON u.id = gm.sender_id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at DESC, gm.rowid DESC
		LIMIT 1
	`, groupID)

	var item dto.GroupConversationResponse
	var lastMessage string
	var lastMessageAt time.Time
	if err := row.Scan(
		&item.GroupID,
		&item.GroupTitle,
		&item.GroupAvatar,
		&lastMessage,
		&lastMessageAt,
		&item.LastSenderID,
		&item.LastSender,
		&item.LastSenderAvatarPath,
	); err != nil {
		return nil, err
	}

	item.LastMessage = &lastMessage
	item.LastMessageAt = &lastMessageAt

	return &item, nil
}
