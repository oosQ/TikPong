package services

import (
	"social-network/src/app/user/block/dto"
	"social-network/src/app/user/block/repo"
)

func GetBlockedUsers(currentUserID, cursor string, limit int) (*dto.GetBlockedUsersResponse, error) {
	return repo.GetBlockedUsers(currentUserID, cursor, limit)
}
