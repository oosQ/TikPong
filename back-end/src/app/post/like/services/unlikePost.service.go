package services

import (
	"errors"
	"social-network/src/app/post/like/repo"
)

func UnlikePost(currentUserID, postID string) error {
	alreadyLiked, err := repo.CheckPostLikeExists(postID, currentUserID)
	if err != nil {
		return err
	}
	if !alreadyLiked {
		return errors.New("post is not liked")
	}

	return repo.DeletePostLike(postID, currentUserID)
}
