package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
)

func LikeComment(currentUserID, commentID string) error {
	commentExists, err := repo.CommentExists(commentID)
	if err != nil {
		return err
	}
	if !commentExists {
		return errors.New("comment not found")
	}

	alreadyLiked, err := repo.CheckCommentLikeExists(commentID, currentUserID)
	if err != nil {
		return err
	}
	if alreadyLiked {
		return errors.New("comment already liked")
	}

	return repo.CreateCommentLike(commentID, currentUserID)
}
