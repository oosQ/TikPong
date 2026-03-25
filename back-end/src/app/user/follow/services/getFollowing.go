package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetFollowing(currentUserID string) ([]dto.FollowInfoResponse, error) {
	return repo.GetFollowing(currentUserID)
}