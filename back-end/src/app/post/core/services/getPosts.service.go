package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetPosts(currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	return repo.GetPosts(currentUserID, cursor, limit)
}
