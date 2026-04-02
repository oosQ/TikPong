package services

import (
	"errors"
	"social-network/src/app/group/join-requests/dto"
	"social-network/src/app/group/join-requests/repo"
	"social-network/src/app/group/shared"
)

func ListJoinRequests(groupID, userID, cursor string, limit int) (*dto.ListJoinRequestsResponse, error) {
	isCreator, err := shared.IsGroupOwner(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !isCreator {
		return nil, errors.New("only group creator can list join requests")
	}
	return repo.ListJoinRequests(groupID, cursor, limit)
}
