package services

import (
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/repo"
)

func GetPrivateConversations(currentUserID, cursor string, limit int) (*dto.GetPrivateConversationsResponse, error) {
	return repo.GetPrivateConversations(currentUserID, cursor, limit)
}
