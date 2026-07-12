package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetExplorePosts(currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	return repo.GetExplorePosts(currentUserID, cursor, limit)
}
