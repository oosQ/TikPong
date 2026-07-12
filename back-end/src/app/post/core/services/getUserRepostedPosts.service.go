package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetUserRepostedPosts(userID, currentUserID, cursor string, limit int) (*dto.GetPostsResponse, error) {
	return repo.GetRepostedPostsByUserID(userID, currentUserID, cursor, limit)
}
