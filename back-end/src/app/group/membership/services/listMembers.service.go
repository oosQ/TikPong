package services

import (
	"errors"
	"social-network/src/app/group/membership/repo"
	"social-network/src/app/group/membership/dto"
	"social-network/src/app/group/shared"
)
func ListMembers(groupID, userID, cursor string, limit int) (*dto.ListMembersResponse, error) {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, errors.New("only group members can list members")
	}

	return repo.ListMembers(groupID, cursor, limit)
}

