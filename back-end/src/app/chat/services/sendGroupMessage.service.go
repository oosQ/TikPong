package services

import (
	"errors"
	"social-network/src/app/chat/repo"
	"social-network/src/app/group/shared"
	"social-network/src/utils"
	"social-network/src/ws"
	"strings"
)

func SendGroupMessage(groupID, senderID, content string) (string, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return "", errors.New("content is required")
	}

	isMember, err := shared.IsMember(groupID, senderID)
	if err != nil {
		return "", err
	}
	if !isMember {
		return "", errors.New("only group members can send group chat messages")
	}

	messageID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate message id")
	}

	if err := repo.SaveGroupMessage(messageID, groupID, senderID, content); err != nil {
		return "", err
	}

	memberIDs, err := shared.GetGroupMemberIDs(groupID)
	if err == nil {
		ws.GlobalHub().SendToUsers(memberIDs, "chat:group:new", map[string]any{
			"id":        messageID,
			"group_id":  groupID,
			"sender_id": senderID,
			"content":   content,
		})

		if groupConversation, convErr := repo.GetGroupConversationSummary(groupID); convErr == nil {
			ws.GlobalHub().SendToUsers(memberIDs, "chat:group:conversation-updated", groupConversation)
		}
	}

	return messageID, nil
}
