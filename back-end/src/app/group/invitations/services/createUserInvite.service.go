package services

import (
	"errors"
	"social-network/src/app/group/invitations/repo"
	"social-network/src/app/group/shared"
	notificationservices "social-network/src/app/notification/services"
)

func InviteUser(groupID, inviterID, inviteeID string) error {
	if inviteeID == "" {
		return errors.New("invitee id is required")
	}
	if inviterID == inviteeID {
		return errors.New("cannot invite yourself")
	}

	exists, err := shared.GroupExists(groupID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("group not found")
	}

	isInviterMember, err := shared.IsMember(groupID, inviterID)
	if err != nil {
		return err
	}
	if !isInviterMember {
		return errors.New("only group members can invite users")
	}

	isInviteeMember, err := shared.IsMember(groupID, inviteeID)
	if err != nil {
		return err
	}
	if isInviteeMember {
		return errors.New("user is already a member")
	}

	if err := repo.InviteUser(groupID, inviterID, inviteeID); err != nil {
		return err
	}

	_ = notificationservices.CreateAndDispatch(inviteeID, "group_invitation", "Group invitation", "You received a group invitation", map[string]any{
		"group_id":   groupID,
		"inviter_id": inviterID,
	})
	return nil
}