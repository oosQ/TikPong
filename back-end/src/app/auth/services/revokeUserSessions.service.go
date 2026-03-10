package services

import (
	"social-network/src/app/auth/repo"
)

func RevokeUserSessions(userID string) error {
	return repo.DeleteSessionsByUserID(userID)
}