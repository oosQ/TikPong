package services

import (
	"social-network/src/app/auth/repo"
)

func LogoutUser(sessionID string) error {
	return repo.DeleteSession(sessionID)
}