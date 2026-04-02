package services

import (
	"errors"
	"social-network/src/app/group/membership/repo"
	"social-network/src/app/group/shared"
)

func RemoveMember(groupID, userID, targetUserID string) error {
	isOwner, err := shared.IsGroupOwner(groupID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only group owner can remove members")
	}
	if userID == targetUserID {
		return errors.New("owner cannot remove themselves")
	}
	isMember, err := shared.IsMember(groupID, targetUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("user is not a member of the group")
	}

	return repo.RemoveMember(groupID, targetUserID)
}
