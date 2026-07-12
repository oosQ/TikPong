package services

import (
	"social-network/src/app/chat/dto"
	"social-network/src/app/chat/repo"
	"social-network/src/ws"
)

func MarkPrivateMessagesRead(currentUserID, otherUserID string) (*dto.PrivateConversationResponse, error) {
	if err := validatePrivateChatAccess(currentUserID, otherUserID); err != nil {
		return nil, err
	}

	if err := repo.MarkPrivateMessagesRead(currentUserID, otherUserID); err != nil {
		return nil, err
	}

	summary, err := repo.GetPrivateConversationSummary(currentUserID, otherUserID)
	if err != nil {
		return nil, err
	}

	ws.GlobalHub().SendToUser(currentUserID, "chat:private:conversation-updated", summary)

	return summary, nil
}
