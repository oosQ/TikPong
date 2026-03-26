package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
	"strings"
)

func EditComment(currentUserID, commentID, content string) error {
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
		return errors.New("you can only edit your own comments")
	}

	return repo.EditComment(commentID, strings.TrimSpace(content))
}
