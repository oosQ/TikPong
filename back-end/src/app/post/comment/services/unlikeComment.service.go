package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
)

func UnlikeComment(currentUserID, commentID string) error {
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
	if !alreadyLiked {
		return errors.New("comment is not liked")
	}

	return repo.DeleteCommentLike(commentID, currentUserID)
}
