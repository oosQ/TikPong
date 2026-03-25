package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetFollowers(currentUserID string) ([]dto.FollowInfoResponse, error) {
	return repo.GetFollowers(currentUserID)
}