package services

import (
	"errors"
	"social-network/src/app/group/repo"
	"social-network/src/app/group/dto"
)

func ListMembers(groupID, userID string) ([]dto.GroupMemberResponse, error) {
	member, err := repo.IsMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, errors.New("only group members can list members")
	}

	return repo.ListMembers(groupID)
}

func RemoveMember(groupID, userID, targetUserID string) error {
	isOwner, err := repo.IsGroupOwner(groupID, userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return errors.New("only group owner can remove members")
	}
	if userID == targetUserID {
		return errors.New("owner cannot remove themselves")
	}
    isMember, err := repo.IsMember(groupID, targetUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("user is not a member of the group")
	}

	return repo.RemoveMember(groupID, targetUserID)
}