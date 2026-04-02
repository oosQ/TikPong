package services

import (
	"errors"
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetPost(postID, currentUserID string) (*dto.PostDetailResponse, error) {
	post, err := repo.GetPostByID(postID, currentUserID)
	if err != nil {
		return nil, err
	}
	if post == nil {
		return nil, errors.New("post not found or you do not have permission to view it")
	}

	return post, nil
}
