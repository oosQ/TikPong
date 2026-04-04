package services	

import (
	"errors"
	"social-network/src/app/group/events/repo"
)

func CancelEvent(groupID, eventID, userID string) error {
	belongs, err := repo.EventBelongsToGroup(eventID, groupID)
	if err != nil {
		return err
	}
	if !belongs {
		return errors.New("event not found in group")
	}

	isCreator, err := repo.IsEventCreator(eventID, userID)
	if err != nil {
		return err
	}
	if !isCreator {
		return errors.New("only event creator can cancel event")
	}

	return repo.DeleteEvent(groupID, eventID)
}
