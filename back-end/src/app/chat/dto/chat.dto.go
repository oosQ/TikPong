package dto

import "time"

type SendMessageRequest struct {
	Content   string `json:"content"`
	ImagePath string `json:"image_path,omitempty"`
}

type PrivateMessageResponse struct {
	ID          string    `json:"id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id"`
	Content     string    `json:"content"`
	ImagePath   string    `json:"image_path,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type GetPrivateMessagesResponse struct {
	Messages   []PrivateMessageResponse `json:"messages"`
	NextCursor string                   `json:"next_cursor,omitempty"`
	Limit      int                      `json:"limit"`
}

type GroupMessageResponse struct {
	ID         string    `json:"id"`
	GroupID    string    `json:"group_id"`
	SenderID   string    `json:"sender_id"`
	Nickname   string    `json:"nickname"`
	AvatarPath string    `json:"avatar_path"`
	Content    string    `json:"content"`
	ImagePath  string    `json:"image_path,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type GetGroupMessagesResponse struct {
	Messages   []GroupMessageResponse `json:"messages"`
	NextCursor string                 `json:"next_cursor,omitempty"`
	Limit      int                    `json:"limit"`
}

type PrivateConversationResponse struct {
	UserID        string    `json:"user_id"`
	Nickname      string    `json:"nickname"`
	FirstName     string    `json:"first_name"`
	LastName      string    `json:"last_name"`
	AvatarPath    string    `json:"avatar_path"`
	Status        string    `json:"status"`
	LastMessage   string    `json:"last_message"`
	LastMessageAt time.Time `json:"last_message_at"`
	LastSenderID  string    `json:"last_sender_id"`
	UnreadCount   int       `json:"unread_count"`
}

type GetPrivateConversationsResponse struct {
	Conversations []PrivateConversationResponse `json:"conversations"`
	NextCursor    string                        `json:"next_cursor,omitempty"`
	Limit         int                           `json:"limit"`
}

type GroupConversationResponse struct {
	GroupID              string     `json:"group_id"`
	GroupTitle           string     `json:"group_title"`
	GroupAvatar          string     `json:"group_avatar"`
	LastMessage          *string    `json:"last_message"`
	LastMessageAt        *time.Time `json:"last_message_at"`
	LastSenderID         string     `json:"last_sender_id"`
	LastSender           string     `json:"last_sender"`
	LastSenderAvatarPath string     `json:"last_sender_avatar_path"`
}

type GetGroupConversationsResponse struct {
	Conversations []GroupConversationResponse `json:"conversations"`
	NextCursor    string                      `json:"next_cursor,omitempty"`
	Limit         int                         `json:"limit"`
}
