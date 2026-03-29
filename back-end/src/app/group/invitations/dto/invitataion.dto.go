package dto

import "time"

type SentInvitationResponse struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"group_id"`
	GroupTitle  string    `json:"group_title"`
	InviteeID   string    `json:"invitee_id"`
	InviteeNickname string    `json:"invitee_nickname"`
	AvatarPath  string    `json:"avatar_path"`
	CreatedAt   time.Time `json:"created_at"`
}
type ReceivedInvitationResponse struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"group_id"`
	GroupTitle  string    `json:"group_title"`
InviterID   string    `json:"inviter_id"`
InviterNickname string    `json:"inviter_nickname"`
AvatarPath  string    `json:"avatar_path"`
CreatedAt   time.Time `json:"created_at"`
}