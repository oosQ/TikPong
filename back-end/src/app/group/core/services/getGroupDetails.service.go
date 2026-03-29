package services

import (
	"social-network/src/app/group/core/dto"
	"social-network/src/app/group/core/repo"
	"social-network/src/app/group/shared"
	"errors"
)

func GetGroupDetails(groupID, userID string) (dto.GetGroupDetailsResponse, error) {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return dto.GetGroupDetailsResponse{}, err
	}
	if !member {
		return dto.GetGroupDetailsResponse{}, errors.New("only group members can view group details")
	}
	return repo.GetGroupDetails(groupID) 
}
