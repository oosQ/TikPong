package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetSentFollowRequests(currentUserID string) ([]dto.FollowRequestResponse, error) {
	return repo.GetSentFollowRequests(currentUserID)
}