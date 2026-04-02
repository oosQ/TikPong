package services

import (
	"social-network/src/app/user/follow/dto"
	"social-network/src/app/user/follow/repo"
)

func GetFollowers(currentUserID, cursor string, limit int) (*dto.GetFollowInfoResponse, error) {
	return repo.GetFollowers(currentUserID, cursor, limit)
}