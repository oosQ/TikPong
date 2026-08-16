package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetUserRepostedPosts(userID, currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	allowed, err := repo.CanViewUserContent(userID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return &dto.GetPostsResponse{Posts: []dto.PostSummaryResponse{}, Limit: limit}, nil
	}
	return repo.GetRepostedPostsByUserID(userID, currentUserID, cursor, limit)
}
