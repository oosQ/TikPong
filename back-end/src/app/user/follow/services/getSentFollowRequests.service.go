package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetSentFollowRequests(currentUserID, cursor string, limit int) (*dto.GetSentFollowRequestsResponse, error) {
	return repo.GetSentFollowRequests(currentUserID, cursor, limit)
}