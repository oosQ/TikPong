package services

import (
	"errors"
	"social-network/src/app/group/events/dto"
	"social-network/src/app/group/events/repo"
	"social-network/src/app/group/shared"
)

func GetEventResponses(groupID, eventID, userID, cursor string, limit int) (*dto.ListEventResponsesResponse, error) {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, errors.New("only group members can view event responses")
	}
	belongs, err := repo.EventBelongsToGroup(eventID, groupID)
	if err != nil {
		return nil, err
	}
	if !belongs {
		return nil, errors.New("event not found in group")
	}
	return repo.GetEventResponses(eventID, cursor, limit)
}