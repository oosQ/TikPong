package services

import (
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/repo"
)

func GetGroupConversations(currentUserID, cursor string, limit int) (*dto.GetGroupConversationsResponse, error) {
	return repo.GetGroupConversations(currentUserID, cursor, limit)
}
