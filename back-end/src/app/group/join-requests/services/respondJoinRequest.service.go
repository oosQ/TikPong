package services

import (
	"errors"
	"social-network/src/app/group/join-requests/repo"
	"social-network/src/app/group/shared"
)

func RespondJoinRequest(groupID, creatorID, requesterID, status string) error {
	if status != "accepted" && status != "rejected" {
		return errors.New("status must be accepted or rejected")
	}

	isCreator, err := shared.IsGroupOwner(groupID, creatorID)
	if err != nil {
		return err
	}
	if !isCreator {
		return errors.New("only group creator can respond to join requests")
	}

	requestStatus, err := repo.GetJoinRequestStatus(groupID, requesterID)
	if err != nil {
		return err
	}
	if requestStatus != "pending" {
		return errors.New("pending join request not found")
	}

	return repo.RespondJoinRequest(groupID, requesterID, status)
}
