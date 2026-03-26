package services

import (
	"errors"
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/repo"
)

func GetComments(postID string) ([]dto.CommentResponse, error) {
	postExists, err := repo.PostExists(postID)
	if err != nil {
		return nil, err
	}
	if !postExists {
		return nil, errors.New("post not found")
	}

	return repo.GetCommentsByPostID(postID)
}
