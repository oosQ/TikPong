package dto

import "time"

type NotificationResponse struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Payload   string    `json:"payload,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type GetNotificationsResponse struct {
	Notifications []NotificationResponse `json:"notifications"`
	NextCursor    string                 `json:"next_cursor,omitempty"`
	Limit         int                    `json:"limit"`
}
