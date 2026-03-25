package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetFollowRequests(currentUserID string) ([]dto.FollowRequestReceivedResponse, error) {
	return repo.GetFollowRequests(currentUserID)
}