package repo

import (
	"database/sql"
	"social-network/src/app/notification/dto"
	database "social-network/src/db"
	"time"
)

func CreateNotification(id, userID, notificationType, title, message string, payload *string) error {
	_, err := database.DB.Exec(`
		INSERT INTO notifications (id, user_id, type, title, message, payload, is_read, created_at)
		VALUES (?, ?, ?, ?, ?, ?, 0, ?)
	`, id, userID, notificationType, title, message, payload, time.Now())
	return err
}

func GetNotifications(userID string, unreadOnly bool, cursor string, limit int) (*dto.GetNotificationsResponse, error) {
	query := `
		SELECT id, type, title, message, COALESCE(payload, ''), is_read, created_at
		FROM notifications
		WHERE user_id = ?
		AND (? = '' OR (
			created_at < (SELECT created_at FROM notifications WHERE id = ?) OR
			(created_at = (SELECT created_at FROM notifications WHERE id = ?) AND id < ?)
		))`
	if unreadOnly {
		query += ` AND is_read = 0`
	}
	query += ` ORDER BY created_at DESC, id DESC LIMIT ?`

	rows, err := database.DB.Query(query, userID, cursor, cursor, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.NotificationResponse, 0)
	for rows.Next() {
		var item dto.NotificationResponse
		var isRead int
		if err := rows.Scan(&item.ID, &item.Type, &item.Title, &item.Message, &item.Payload, &isRead, &item.CreatedAt); err != nil {
			return nil, err
		}
		item.IsRead = isRead == 1
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.GetNotificationsResponse{Limit: limit, Notifications: items}
	if len(items) > limit {
		result.Notifications = items[:limit]
		result.NextCursor = result.Notifications[len(result.Notifications)-1].ID
	}
	return result, nil
}

func MarkRead(userID, notificationID string) error {
	_, err := database.DB.Exec(`
		UPDATE notifications
		SET is_read = 1
		WHERE id = ? AND user_id = ?
	`, notificationID, userID)
	return err
}

func MarkAllRead(userID string) error {
	_, err := database.DB.Exec(`
		UPDATE notifications
		SET is_read = 1
		WHERE user_id = ?
	`, userID)
	return err
}

func NotificationExists(userID, notificationID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM notifications WHERE id = ? AND user_id = ?
	`, notificationID, userID).Scan(&count)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return count > 0, nil
}

func GetUnreadCount(userID string) (int, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0
	`, userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
