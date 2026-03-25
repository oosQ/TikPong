package services

import (
	"social-network/src/app/user/auth/repo"
)

func RevokeUserSessions(userID string) error {
	return repo.DeleteSessionsByUserID(userID)
}