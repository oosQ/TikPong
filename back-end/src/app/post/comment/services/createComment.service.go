package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
	sharedRepo "social-network/src/app/post/shared/repo"
	"social-network/src/utils"
	"strings"
)

func CreateComment(currentUserID, postID, content, imagePath string) (string, error) {
	canAccess, err := sharedRepo.CanUserAccessPost(postID, currentUserID)
	if err != nil {
		return "", err
	}
	if !canAccess {
		return "", errors.New("post not found or access denied")
	}

	commentID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate comment id")
	}

	err = repo.CreateComment(commentID, postID, currentUserID, strings.TrimSpace(content), strings.TrimSpace(imagePath))
	if err != nil {
		return "", err
	}

	return commentID, nil
}
