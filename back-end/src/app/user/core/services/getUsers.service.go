package services

import (
	"social-network/src/app/user/core/dto"
	"social-network/src/app/user/core/repo"
)

func GetUsers(currentUserID, cursor string, limit int) (*dto.GetUsersResponse, error) {
	return repo.GetUsers(currentUserID, cursor, limit)
}