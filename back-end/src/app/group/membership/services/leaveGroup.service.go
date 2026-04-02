package services

import (
	"errors"
	"social-network/src/app/group/membership/repo"
    "social-network/src/app/group/shared"
)
func LeaveGroup(groupID, userID string) error {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return err
	}
	if !member {
		return errors.New("only group members can leave the group")
	}
	return repo.LeaveGroup(groupID, userID)
}
