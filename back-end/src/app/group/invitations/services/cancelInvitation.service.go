package services 

import (
	"errors"
	"social-network/src/app/group/invitations/repo"
)


func CancelInvitation(groupID, inviterID, inviteeID string) error {
	invStatus, err := repo.GetInvitationStatus(groupID, inviteeID)
	if err != nil {
		return err
	}
	if invStatus != "pending" {
		return errors.New("pending invitation not found")
	}
	return repo.CancelInvitation(groupID, inviterID, inviteeID)
}