package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetCurrentUserLikedPosts(currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	return repo.GetCurrentUserLikedPosts(currentUserID, cursor, limit)
}
