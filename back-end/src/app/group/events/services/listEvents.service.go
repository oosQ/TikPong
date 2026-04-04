package services

import ( 
	"errors"
	"social-network/src/app/group/events/dto"
	"social-network/src/app/group/events/repo"
	"social-network/src/app/group/shared"
)

func ListEvents(groupID, userID, cursor string, limit int) (*dto.ListEventsResponse, error) {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, errors.New("only group members can view events")
	}
	return repo.ListEvents(groupID, cursor, limit)
}

