package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetFollowing(currentUserID, cursor string, limit int) (*dto.GetFollowInfoResponse, error) {
	return repo.GetFollowing(currentUserID, cursor, limit)
}