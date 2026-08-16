package dto

import "time"

type SentInvitationResponse struct {
	ID              string    `json:"id"`
	GroupID         string    `json:"group_id"`
	GroupTitle      string    `json:"group_title"`
	GroupAvatar     string    `json:"group_avatar"`
	InviteeID       string    `json:"invitee_id"`
	InviteeNickname string    `json:"invitee_nickname"`
	AvatarPath      string    `json:"avatar_path"`
	InviteeStatus   string    `json:"invitee_status"`
	CreatedAt       time.Time `json:"created_at"`
}

type ListSentInvitationsResponse struct {
	Invitations []SentInvitationResponse `json:"invitations"`
	NextCursor  string                   `json:"next_cursor,omitempty"`
	Limit       int                      `json:"limit"`
}

type ReceivedInvitationResponse struct {
	ID              string    `json:"id"`
	GroupID         string    `json:"group_id"`
	GroupTitle      string    `json:"group_title"`
	GroupAvatar     string    `json:"group_avatar"`
	InviterID       string    `json:"inviter_id"`
	InviterNickname string    `json:"inviter_nickname"`
	AvatarPath      string    `json:"avatar_path"`
	InviterStatus   string    `json:"inviter_status"`
	CreatedAt       time.Time `json:"created_at"`
}

type ListReceivedInvitationsResponse struct {
	Invitations []ReceivedInvitationResponse `json:"invitations"`
	NextCursor  string                       `json:"next_cursor,omitempty"`
	Limit       int                          `json:"limit"`
}
