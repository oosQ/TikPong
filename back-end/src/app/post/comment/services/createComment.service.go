package services

import (
	"errors"
	"social-network/src/app/post/comment/repo"
	"social-network/src/utils"
	"strings"
)

func CreateComment(currentUserID, postID, content string) (string, error) {
	postExists, err := repo.PostExists(postID)
	if err != nil {
		return "", err
	}
	if !postExists {
		return "", errors.New("post not found")
	}

	commentID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate comment id")
	}

	err = repo.CreateComment(commentID, postID, currentUserID, strings.TrimSpace(content))
	if err != nil {
		return "", err
	}

	return commentID, nil
}
