package services

import (
	"errors"
	"social-network/src/app/chat/repo"
	notificationservices "social-network/src/app/notification/services"
	userrepo "social-network/src/app/user/core/repo"
	"social-network/src/utils"
	"social-network/src/ws"
	"strings"
)

func SendPrivateMessage(senderID, recipientID, content, imagePath string) (string, error) {
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
	imagePath = strings.TrimSpace(imagePath)
	if content == "" && imagePath == "" {
		return "", errors.New("content or image is required")
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

	if err := repo.SavePrivateMessage(messageID, senderID, recipientID, content, imagePath); err != nil {
		return "", err
	}

	payload := map[string]any{
		"id":           messageID,
		"sender_id":    senderID,
		"recipient_id": recipientID,
		"content":      content,
		"image_path":   imagePath,
	}

	ws.GlobalHub().SendToUser(recipientID, "chat:private:new", payload)

	if recipientConversation, err := repo.GetPrivateConversationSummary(recipientID, senderID); err == nil {
		ws.GlobalHub().SendToUser(recipientID, "chat:private:conversation-updated", recipientConversation)
	}

	if senderConversation, err := repo.GetPrivateConversationSummary(senderID, recipientID); err == nil {
		ws.GlobalHub().SendToUser(senderID, "chat:private:conversation-updated", senderConversation)
	}

	senderName := userrepo.GetUserDisplayName(senderID)
	_ = notificationservices.CreateAndDispatch(recipientID, "private_message", "New private message", senderName+" sent you a message", map[string]any{
		"sender_id":   senderID,
		"sender_name": senderName,
		"message_id":  messageID,
		"preview":     content,
	})

	return messageID, nil
}
