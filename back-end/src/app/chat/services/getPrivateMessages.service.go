package services

import (
	"errors"
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/repo"
)

func GetPrivateMessages(currentUserID, otherUserID, cursor string, limit int) (*dto.GetPrivateMessagesResponse, error) {
	blocked, err := repo.CheckBlockedEitherWay(currentUserID, otherUserID)
	if err != nil {
		return nil, err
	}
	if blocked {
		return nil, errors.New("cannot access chats with a blocked user")
	}

	followsA, err := repo.IsFollowing(currentUserID, otherUserID)
	if err != nil {
		return nil, err
	}
	followsB, err := repo.IsFollowing(otherUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !followsA && !followsB {
		return nil, errors.New("you can only access chats for mutual follow graph")
	}
	return repo.GetPrivateMessages(currentUserID, otherUserID, cursor, limit)
}
