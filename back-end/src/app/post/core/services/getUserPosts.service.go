package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetUserPosts(userID, currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	return repo.GetPostsByUserID(userID, currentUserID, cursor, limit)
}
