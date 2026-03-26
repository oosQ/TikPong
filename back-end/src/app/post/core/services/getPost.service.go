package services

import (
	"errors"
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func GetPost(postID string) (*dto.PostDetailResponse, error) {
	post, err := repo.GetPostByID(postID)
	if err != nil {
		return nil, err
	}
	if post == nil {
		return nil, errors.New("post not found")
	}

	return post, nil
}
