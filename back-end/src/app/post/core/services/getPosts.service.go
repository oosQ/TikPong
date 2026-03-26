package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetPosts(currentUserID string) ([]dto.PostSummaryResponse, error) {
	return repo.GetPosts(currentUserID)
}
