package services

import (
	"errors"
	"strings"
	"social-network/src/app/group/posts/core/dto"
	"social-network/src/app/group/posts/core/repo"
	"social-network/src/utils"
	"social-network/src/app/group/shared"
)

func CreateGroupPost(groupID, userID string, req dto.CreateGroupPostRequest) (string, error) {
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		return "", errors.New("title and content are required")
	}

	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return "", err
	}
	if !member {
		return "", errors.New("only group members can post")
	}

	postID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate post id")
	}

	err = repo.CreateGroupPost(postID, groupID, userID, strings.TrimSpace(req.Title), strings.TrimSpace(req.Content), strings.TrimSpace(req.ImagePath))
	if err != nil {
		return "", err
	}
	return postID, nil
}
