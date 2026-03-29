package services

import "social-network/src/app/notification/repo"

func GetNotifications(userID string, unreadOnly bool) (any, error) {
	return repo.GetNotifications(userID, unreadOnly)
}
