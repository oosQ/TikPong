package services

import (
	"errors"
	"social-network/src/app/group/invitations/repo"
)
func RespondInvitation(groupID, inviteeID, status string) error {
	if status != "accepted" && status != "rejected" {
		return errors.New("status must be accepted or rejected")
	}

	invStatus, err := repo.GetInvitationStatus(groupID, inviteeID)
	if err != nil {
		return err
	}
	if invStatus != "pending" {
		return errors.New("pending invitation not found")
	}

	return repo.RespondInvitation(groupID, inviteeID, status)
}