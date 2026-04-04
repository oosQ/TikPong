package services

import (
	"errors"
	"social-network/src/app/chat/repo"
	notificationservices "social-network/src/app/notification/services"
	"social-network/src/utils"
	"social-network/src/ws"
	"strings"
)

func SendPrivateMessage(senderID, recipientID, content string) (string, error) {
	if senderID == recipientID {
		return "", errors.New("cannot message yourself")
	}

	blocked, err := repo.CheckBlockedEitherWay(senderID, recipientID)
	if err != nil {
		return "", err
	}
	if blocked {
		return "", errors.New("cannot message a blocked user")
	}

	content = strings.TrimSpace(content)
	if content == "" {
		return "", errors.New("content is required")
	}

	followsA, err := repo.IsFollowing(senderID, recipientID)
	if err != nil {
		return "", err
	}
	followsB, err := repo.IsFollowing(recipientID, senderID)
	if err != nil {
		return "", err
	}

	if !followsA && !followsB {
		return "", errors.New("you can only message users you follow or who follow you")
	}

	messageID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate message id")
	}

	if err := repo.SavePrivateMessage(messageID, senderID, recipientID, content); err != nil {
		return "", err
	}

	recipientFollowsSender, err := repo.IsFollowing(recipientID, senderID)
	if err != nil {
		return "", err
	}
	recipientPublic, err := repo.IsUserPublic(recipientID)
	if err != nil {
		return "", err
	}

	payload := map[string]any{
		"id":           messageID,
		"sender_id":    senderID,
		"recipient_id": recipientID,
		"content":      content,
	}

	if recipientFollowsSender || recipientPublic {
		ws.GlobalHub().SendToUser(recipientID, "chat:private:new", payload)
	}

	if recipientConversation, err := repo.GetPrivateConversationSummary(recipientID, senderID); err == nil {
		ws.GlobalHub().SendToUser(recipientID, "chat:private:conversation-updated", recipientConversation)
	}

	if senderConversation, err := repo.GetPrivateConversationSummary(senderID, recipientID); err == nil {
		ws.GlobalHub().SendToUser(senderID, "chat:private:conversation-updated", senderConversation)
	}

	_ = notificationservices.CreateAndDispatch(recipientID, "private_message", "New private message", "You received a private message", map[string]any{
		"sender_id":  senderID,
		"message_id": messageID,
	})

	return messageID, nil
}
