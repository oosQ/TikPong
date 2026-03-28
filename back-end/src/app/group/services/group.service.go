package services

import (
	"errors"
	"social-network/src/app/group/dto"
	"social-network/src/app/group/repo"
	"social-network/src/utils"
	"strings"
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

func BrowseGroups() ([]dto.GroupResponse, error) {
	return repo.GetGroups()
}

func DeleteGroup(groupID, userID string) error {
	isOwner, err := repo.IsGroupOwner(groupID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only group owner can delete the group")
	}
	return repo.DeleteGroup(groupID)
}

func UpdateGroup(groupID, userID string, req dto.UpdateGroupRequest) error {
	isOwner, err := repo.IsGroupOwner(groupID, userID)
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

func GetGroupDetails(groupID, userID string) (dto.GetGroupDetailsResponse, error) {
	member, err := repo.IsMember(groupID, userID)
	if err != nil {
		return dto.GetGroupDetailsResponse{}, err
	}
	if !member {
		return dto.GetGroupDetailsResponse{}, errors.New("only group members can view group details")
	}
	return repo.GetGroupDetails(groupID) 
}

func LeaveGroup(groupID, userID string) error {
	member, err := repo.IsMember(groupID, userID)
	if err != nil {
		return err
	}
	if !member {
		return errors.New("only group members can leave the group")
	}
	return repo.LeaveGroup(groupID, userID)
}
