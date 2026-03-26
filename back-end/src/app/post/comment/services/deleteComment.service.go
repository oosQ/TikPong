package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
)

func DeleteComment(currentUserID, commentID string) error {
	commentExists, err := repo.CommentExists(commentID)
	if err != nil {
		return err
	}
	if !commentExists {
		return errors.New("comment not found")
	}

	ownerID, err := repo.GetCommentOwnerID(commentID)
	if err != nil {
		return err
	}
	if ownerID != currentUserID {
		return errors.New("you can only delete your own comments")
	}

	return repo.DeleteComment(commentID)
}
