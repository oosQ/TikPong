package services

import (
	"errors"
	"social-network/src/app/group/shared"
	"social-network/src/app/group/core/repo"
)

func DeleteGroup(groupID, userID string) error {
	isOwner, err := shared.IsGroupOwner(groupID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only group owner can delete the group")
	}
	return repo.DeleteGroup(groupID)
}