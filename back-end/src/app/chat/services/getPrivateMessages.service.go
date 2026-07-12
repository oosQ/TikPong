package services

import (
	"errors"
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/repo"
	"social-network/src/ws"
)

func validatePrivateChatAccess(currentUserID, otherUserID string) error {
	blocked, err := repo.CheckBlockedEitherWay(currentUserID, otherUserID)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New("cannot access chats with a blocked user")
	}

	followsA, err := repo.IsFollowing(currentUserID, otherUserID)
	if err != nil {
		return err
	}
	followsB, err := repo.IsFollowing(otherUserID, currentUserID)
	if err != nil {
		return err
	}
	if !followsA && !followsB {
		return errors.New("you can only access chats for mutual follow graph")
	}

	return nil
}

func GetPrivateMessages(currentUserID, otherUserID, cursor string, limit int) (*dto.GetPrivateMessagesResponse, error) {
	if err := validatePrivateChatAccess(currentUserID, otherUserID); err != nil {
		return nil, err
	}

	result, err := repo.GetPrivateMessages(currentUserID, otherUserID, cursor, limit)
	if err != nil {
		return nil, err
	}

	if err := repo.MarkPrivateMessagesRead(currentUserID, otherUserID); err == nil {
		if summary, summaryErr := repo.GetPrivateConversationSummary(currentUserID, otherUserID); summaryErr == nil {
			ws.GlobalHub().SendToUser(currentUserID, "chat:private:conversation-updated", summary)
		}
	}

	return result, nil
}
