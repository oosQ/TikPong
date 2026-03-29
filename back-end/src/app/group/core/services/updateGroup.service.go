package services

import (
	"errors"
	"strings"
	"social-network/src/app/group/core/dto"
	"social-network/src/app/group/core/repo"
	"social-network/src/app/group/shared"
)

func UpdateGroup(groupID, userID string, req dto.UpdateGroupRequest) error {
	isOwner, err := shared.IsGroupOwner(groupID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only group owner can update the group")
	}
	title := strings.TrimSpace(req.Title)
	description := strings.TrimSpace(req.Description)
	if title == "" || description == "" {
		return errors.New("title and description are required")
	}
	return repo.UpdateGroup(groupID, title, description)
}