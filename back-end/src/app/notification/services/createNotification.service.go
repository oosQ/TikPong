package services

import (
	"encoding/json"
	"social-network/src/app/notification/repo"
	"social-network/src/utils"
	"social-network/src/ws"
)

func CreateAndDispatch(userID, notificationType, title, message string, payload any) error {
	notificationID, err := utils.GenerateUUID()
	if err != nil {
		return err
	}

	var payloadText *string
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		text := string(encoded)
		payloadText = &text
	}

	if notificationType == "follow" || notificationType == "follow_request" || notificationType == "group_join_request" || notificationType == "group_invitation" {
		if err := repo.DeleteUnreadMatchingNotifications(userID, notificationType, payloadText); err != nil {
			return err
		}
	}

	err = repo.CreateNotification(notificationID, userID, notificationType, title, message, payloadText)
	if err != nil {
		return err
	}

	ws.GlobalHub().SendToUser(userID, "notification:new", map[string]any{
		"id":      notificationID,
		"type":    notificationType,
		"title":   title,
		"message": message,
		"payload": payload,
	})

	return nil
}
