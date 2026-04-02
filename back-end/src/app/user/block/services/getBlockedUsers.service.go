package services

import (
	"social-network/src/app/user/block/dto"
	"social-network/src/app/user/block/repo"
)

func GetBlockedUsers(currentUserID string) ([]dto.BlockedUserResponse, error) {
	return repo.GetBlockedUsers(currentUserID)
}
