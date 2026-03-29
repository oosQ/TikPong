package services

import (
	"errors"
	"strings"
	"social-network/src/utils"
	"social-network/src/app/group/core/dto"
	"social-network/src/app/group/core/repo"
)

func CreateGroup(creatorID string, req dto.CreateGroupRequest) (string, error) {
	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	if title == "" || description == "" {
		return "", errors.New("title and description are required")
	}

	groupID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate group id")
	}

	if err := repo.CreateGroup(groupID, title, description, creatorID); err != nil {
		return "", err
	}

	return groupID, nil
}