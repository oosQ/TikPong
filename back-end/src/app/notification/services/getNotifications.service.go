package services

import (
	"social-network/src/app/notification/dto"
	"social-network/src/app/notification/repo"
)

func GetNotifications(userID string, unreadOnly bool, cursor string, limit int) (*dto.GetNotificationsResponse, error) {
	return repo.GetNotifications(userID, unreadOnly, cursor, limit)
}
