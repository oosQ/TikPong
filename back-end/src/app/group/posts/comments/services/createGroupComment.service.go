package services

import (
	"errors"
	"social-network/src/app/group/posts/comments/repo"
	"social-network/src/app/group/shared"
	postShared "social-network/src/app/group/posts/shared"
	"social-network/src/utils"
	"strings"
)

func CreateGroupComment(groupID, postID, userID, content, imagePath string) (string, error) {
	if strings.TrimSpace(content) == "" {
		return "", errors.New("content is required")
	}

	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return "", err
	}
	if !member {
		return "", errors.New("only group members can comment")
	}

	belongs, err := postShared.GroupPostBelongsToGroup(postID, groupID)
	if err != nil {
		return "", err
	}
	if !belongs {
		return "", errors.New("post not found in group")
	}

	commentID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate comment id")
	}

	err = repo.CreateGroupComment(commentID, postID, userID, strings.TrimSpace(content), strings.TrimSpace(imagePath))
	if err != nil {
		return "", err
	}
	return commentID, nil
}
