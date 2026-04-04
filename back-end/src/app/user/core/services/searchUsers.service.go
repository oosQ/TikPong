package services

import (
	"social-network/src/app/user/core/dto"
	"social-network/src/app/user/core/repo"
)

func SearchUsers(currentUserID, query, cursor string, limit int) (*dto.SearchUsersResponse, error) {
	return repo.SearchUsers(currentUserID, query, cursor, limit)
}
