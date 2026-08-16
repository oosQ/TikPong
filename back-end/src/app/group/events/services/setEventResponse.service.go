package services

import (
	"errors"
	"social-network/src/app/group/events/repo"
	"social-network/src/app/group/shared"
)

func SetEventResponse(groupID, eventID, userID, response string) error {
	if response != "going" && response != "not_going" {
		return errors.New("response must be going or not_going")
	}

	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return err
	}
	if !member {
		return errors.New("only group members can answer events")
	}

	belongs, err := repo.EventBelongsToGroup(eventID, groupID)
	if err != nil {
		return err
	}
	if !belongs {
		return errors.New("event not found in group")
	}

	return repo.ToggleEventResponse(eventID, userID, response)
}
