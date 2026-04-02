package services

import (
	"errors"
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/repo"
	sharedRepo "social-network/src/app/post/shared/repo"
)

func GetComments(currentUserID, postID string) ([]dto.CommentResponse, error) {
	canAccess, err := sharedRepo.CanUserAccessPost(postID, currentUserID)
	if err != nil {
		return nil, err
	}
	if !canAccess {
		return nil, errors.New("post not found or access denied")
	}

	return repo.GetCommentsByPostID(postID, currentUserID)
}
