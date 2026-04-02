package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetFollowRequests(currentUserID, cursor string, limit int) (*dto.GetFollowRequestsResponse, error) {
	return repo.GetFollowRequests(currentUserID, cursor, limit)
}