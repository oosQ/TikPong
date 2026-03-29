package services

import (
	"errors"
	"social-network/src/app/notification/repo"
)

func MarkRead(userID, notificationID string) error {
	exists, err := repo.NotificationExists(userID, notificationID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("notification not found")
	}
	return repo.MarkRead(userID, notificationID)
}

func MarkAllRead(userID string) error {
	return repo.MarkAllRead(userID)
}
