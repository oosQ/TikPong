package dto

import "time"

type CreateEventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventTime   string `json:"event_time"`
}

type EventAnswerRequest struct {
	Response string `json:"response"`
}

type EventAnswerResponse struct {
	UserID   string `json:"user_id"`
	Nickname string `json:"nickname"`
	AvatarPath string `json:"avatar_path"`
	Response string `json:"response"`
}

type ListEventResponsesResponse struct {
	Responses  []EventAnswerResponse `json:"responses"`
	NextCursor string                `json:"next_cursor,omitempty"`
	Limit      int                   `json:"limit"`
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

type ListEventsResponse struct {
	Events     []EventResponse `json:"events"`
	NextCursor string          `json:"next_cursor,omitempty"`
	Limit      int             `json:"limit"`
}
