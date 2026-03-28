package services

import (
	"errors"
	"social-network/src/app/post/like/repo"
)

func LikePost(currentUserID, postID string) error {
	postExists, err := repo.PostExists(postID)
	if err != nil {
		return err
	}
	if !postExists {
		return errors.New("post not found")
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
