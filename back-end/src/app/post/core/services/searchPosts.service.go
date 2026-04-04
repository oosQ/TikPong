package services

import (
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func SearchPosts(currentUserID, query, cursor string, limit int) (*dto.SearchPostsResponse, error) {
	return repo.SearchPosts(currentUserID, query, cursor, limit)
}
