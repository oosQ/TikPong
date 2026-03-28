package dto

import "time"

type CreateGroupRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type GroupResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatorID   string    `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type GroupMemberResponse struct {
	UserID     string `json:"user_id"`
	Nickname   string `json:"nickname"`
	AvatarPath string `json:"avatar_path"`
	Role       string `json:"role"`
}

type CreateGroupPostRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type GroupPostResponse struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Nickname  string    `json:"nickname"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateGroupCommentRequest struct {
	Content string `json:"content"`
}

type GroupCommentResponse struct {
	ID          string    `json:"id"`
	GroupPostID string    `json:"group_post_id"`
	UserID      string    `json:"user_id"`
	Content     string    `json:"content"`
	Nickname    string    `json:"nickname"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateEventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventTime   string `json:"event_time"`
}

type EventResponse struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"group_id"`
	CreatorID   string    `json:"creator_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventTime   time.Time `json:"event_time"`
	CreatedAt   time.Time `json:"created_at"`
}

type EventAnswerRequest struct {
	Response string `json:"response"`
}

type EventAnswerResponse struct {
	UserID   string `json:"user_id"`
	Nickname string `json:"nickname"`
	Response string `json:"response"`
}

type UpdateGroupRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
}

type GetGroupDetailsResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatorID   string    `json:"creator_id"`
	CreatorNickname string    `json:"creator_nickname"`
	MemberCount int       `json:"member_count"`
	CreatedAt   time.Time `json:"created_at"`
}

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

type JoinRequestResponse struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"group_id"`
GroupTitle  string    `json:"group_title"`
RequesterID   string    `json:"requester_id"`
RequesterNickname string    `json:"requester_nickname"`
AvatarPath  string    `json:"avatar_path"`
CreatedAt   time.Time `json:"created_at"`
}