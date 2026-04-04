package services

import (
	"errors"
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/repo"
	"social-network/src/app/group/shared"
)

func GetGroupMessages(groupID, currentUserID, cursor string, limit int) (*dto.GetGroupMessagesResponse, error) {
	isMember, err := shared.IsMember(groupID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("only group members can view group chat")
	}

	return repo.GetGroupMessages(groupID, cursor, limit)
}
