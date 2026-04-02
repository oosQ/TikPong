package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
	sharedRepo "social-network/src/app/post/shared/repo"
)

func UnlikeComment(currentUserID, commentID string) error {
	commentExists, err := repo.CommentExists(commentID)
	if err != nil {
		return err
	}
	if !commentExists {
		return errors.New("comment not found")
	}

	postID, err := repo.GetCommentPostID(commentID)
	if err != nil {
		return err
	}
	if postID == "" {
		return errors.New("comment not found")
	}

	canAccess, err := sharedRepo.CanUserAccessPost(postID, currentUserID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("comment not found or access denied")
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
