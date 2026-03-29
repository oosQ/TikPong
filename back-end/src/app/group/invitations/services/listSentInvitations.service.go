package services

import (
	"social-network/src/app/group/invitations/dto"
	"social-network/src/app/group/invitations/repo"
)

func ListReceivedInvitations(userID string) ([]dto.ReceivedInvitationResponse, error) {
	return repo.ListReceivedInvitations(userID)
}