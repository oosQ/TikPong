package services

import (
	"social-network/src/repo"
)

func LogoutUser(sessionID string) error {
	return repo.DeleteSession(sessionID)
}