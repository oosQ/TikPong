package services

import (
	"errors"
	"social-network/src/app/group/invitations/repo"
	"social-network/src/app/group/shared"
	notificationservices "social-network/src/app/notification/services"
	userrepo "social-network/src/app/user/core/repo"
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

	inviterName := userrepo.GetUserDisplayName(inviterID)
	groupTitle := shared.GetGroupTitle(groupID)
	_ = notificationservices.CreateAndDispatch(inviteeID, "group_invitation", "Group invitation", inviterName+" invited you to "+groupTitle, map[string]any{
		"group_id":     groupID,
		"group_title":  groupTitle,
		"inviter_id":   inviterID,
		"inviter_name": inviterName,
	})
	return nil
}
