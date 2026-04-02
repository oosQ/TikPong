package services

import (
	"errors"
	"social-network/src/app/post/like/repo"
	sharedRepo "social-network/src/app/post/shared/repo"
)

func LikePost(currentUserID, postID string) error {
	canAccess, err := sharedRepo.CanUserAccessPost(postID, currentUserID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("post not found or access denied")
	}

	alreadyLiked, err := repo.CheckPostLikeExists(postID, currentUserID)
	if err != nil {
		return err
	}
	if alreadyLiked {
		return errors.New("post already liked")
	}

	return repo.CreatePostLike(postID, currentUserID)
}
